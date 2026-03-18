import { Injectable, NotFoundException, BadRequestException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CategoryDocument } from '../schemas/category.schema';
import { toObjectId } from '../common/utils';

@Injectable()
export class CategoriesService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(CategoryDocument.name)
    private model: Model<CategoryDocument>,
  ) {}

  async onApplicationBootstrap() {
    try {
      const idxs = await this.model.collection.listIndexes().toArray();
      const oldGlobal = idxs.find(idx => idx.name === 'name_1' && idx.unique && !idx.key?.['tenantId']);
      if (oldGlobal) {
        console.log('[CategoriesService] Dropping old global unique index on "name"...');
        await this.model.collection.dropIndex('name_1');
      }
    } catch (err) {
      // Index might not exist or be different; skip quietly
    }
  }

  private toCat(doc: any) {
    if (!doc) return null;
    try {
      const data = doc.toObject ? doc.toObject() : doc;
      const id = (data._id || doc._id)?.toString() || data.id;
      
      if (!id) {
        console.warn('[CategoriesService] Mapping failed: doc missing _id', doc);
        return null;
      }

      return {
        id: id.toString(),
        name: data.name || 'Unnamed Category',
        description: data.description || '',
        tenantId: data.tenantId?.toString() || null,
      };
    } catch (err) {
      console.error('[CategoriesService] Error mapping category row:', err, 'Doc:', doc);
      return null;
    }
  }

  async create(name: string, tenantId: string, description?: string) {
    const cleanName = (name || '').trim();
    if (!cleanName) throw new BadRequestException('Category name is required');
    
    const cleanTenantId = (tenantId || '').trim();
    const tid = toObjectId(cleanTenantId);
    
    if (!tid && cleanTenantId !== 'system' && cleanTenantId !== 'admin') {
      console.warn(`[CategoriesService] Invalid Tenant ID provided: "${cleanTenantId}"`);
    }
    
    try {
      // Attempt to create. Mongoose will cast tenantId according to schema (ObjectId if possible).
      const created = await this.model.create({ 
        name: cleanName, 
        description: (description || '').trim(),
        tenantId: tid || cleanTenantId || undefined
      });
      
      return this.toCat(created);
    } catch (error: any) {
      if (error.code === 11000) {
        // DUPLICATE KEY ERROR: Let's find exactly what's conflicting
        // Match name (case-insensitive search for diagnosis)
        const nameRegex = new RegExp(`^${cleanName}$`, 'i');
        
        // Find if it exists for THIS tenant (robust query)
        const forThisTenant = await this.model.findOne({
          name: nameRegex,
          $or: [{ tenantId: tid }, { tenantId: cleanTenantId }]
        }).lean();

        if (forThisTenant) {
          throw new BadRequestException(
            `Category "${cleanName}" already exists in your list. ` +
            `If you don't see it, please refresh your browser.`
          );
        }

        // Check if it exists for ANY tenant (this handles global index conflict)
        const forAnyTenant = await this.model.findOne({ name: nameRegex }).lean();
        if (forAnyTenant) {
          const owner = forAnyTenant.tenantId?.toString() || 'System/Unknown';
          console.warn(`[CategoriesService] Global collision for "${cleanName}". Owned by tenant: ${owner}`);
          throw new BadRequestException(
            `Category "${cleanName}" is already taken by another account or the system. ` +
            `Please use a unique name.`
          );
        }

        throw new BadRequestException(`Category "${cleanName}" already exists. (Generic conflict)`);
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        throw new BadRequestException(messages.join(', '));
      }
      
      console.error('[CategoriesService] Create error:', error);
      throw error;
    }
  }

  async findAll(tenantId: string) {
    const cleanTenantId = (tenantId || '').trim();
    const tid = toObjectId(cleanTenantId);
    
    try {
      const query: any = {
        $or: [
          { tenantId: tid },
          { tenantId: cleanTenantId }
        ]
      };
      
      // If we are looking for a specific tenant, also include "system" categories (null/empty tenant)
      // This allows shared categories to show up in every tenant's list.
      if (tid || cleanTenantId) {
        query.$or.push({ tenantId: null });
        query.$or.push({ tenantId: '' });
        query.$or.push({ tenantId: { $exists: false } });
      } else {
        // If no tenant provided, only show public ones
        query.$or = [{ tenantId: null }, { tenantId: '' }, { tenantId: { $exists: false } }];
      }

      const docs = await this.model.find(query).sort({ name: 1 }).lean().exec();
      return docs.map(d => this.toCat(d)).filter(Boolean);
    } catch (error) {
      console.error('[CategoriesService] findAll error:', error);
      throw error;
    }
  }

  async findOne(id: string, tenantId: string) {
    const cid = toObjectId(id);
    if (!cid) throw new BadRequestException('Invalid Category ID');

    const cleanTenantId = (tenantId || '').trim();
    const tid = toObjectId(cleanTenantId);

    const doc = await this.model.findOne({ 
      _id: cid, 
      $or: [
        { tenantId: tid }, 
        { tenantId: cleanTenantId },
        { tenantId: null },
        { tenantId: '' },
        { tenantId: { $exists: false } }
      ]
    }).lean();
    
    if (!doc) throw new NotFoundException('Category not found or access denied');
    return this.toCat(doc);
  }

  async update(id: string, tenantId: string, data: { name?: string; description?: string }) {
    await this.findOne(id, tenantId); // Authorization check
    
    const cleanTenantId = (tenantId || '').trim();
    const tid = toObjectId(cleanTenantId);
    const cid = toObjectId(id);

    try {
      await this.model.updateOne(
        { _id: cid, $or: [{ tenantId: tid }, { tenantId: cleanTenantId }] }, 
        { $set: data }
      );
      return this.findOne(id, tenantId);
    } catch (err: any) {
      if (err.code === 11000) throw new BadRequestException('Another category with this name already exists.');
      throw err;
    }
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId); // Authorization check
    
    const cleanTenantId = (tenantId || '').trim();
    const tid = toObjectId(cleanTenantId);
    const cid = toObjectId(id);

    await this.model.deleteOne({ 
      _id: cid, 
      $or: [{ tenantId: tid }, { tenantId: cleanTenantId }] 
    });
    return { success: true };
  }
}
