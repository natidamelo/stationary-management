import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DistributionDocument } from '../schemas/distribution.schema';
import { StockMovementType } from '../common/enums';
import { InventoryService } from '../inventory/inventory.service';
import { toObjectId } from '../common/utils';

@Injectable()
export class DistributionService {
  constructor(
    @InjectModel(DistributionDocument.name)
    private model: Model<DistributionDocument>,
    private inventory: InventoryService,
  ) {}

  private async nextDistributionNumber(tenantId: string): Promise<string> {
    const tid = toObjectId(tenantId);
    if (!tid) return `DIS-${Date.now()}`;
    const last = await this.model.findOne({ tenantId: tid }).sort({ createdAt: -1 }).lean();
    const num = last ? parseInt(String(last.distributionNumber).replace(/\D/g, ''), 10) + 1 : 1;
    return `DIS-${String(num).padStart(6, '0')}`;
  }

  private toDist(doc: any) {
    if (!doc) return null;
    const o = doc.toObject ? doc.toObject() : doc;
    const issuedToUser = (o as any).issuedToUserId;
    const lines = (o.lines || []).map((l: any) => ({
      id: l._id?.toString(),
      itemId: (l.itemId?._id || l.itemId)?.toString?.(),
      item: l.itemId?.name ? { name: l.itemId.name, sku: l.itemId.sku } : undefined,
      quantity: l.quantity,
    }));
    return {
      id: (o._id || doc._id)?.toString(),
      distributionNumber: o.distributionNumber,
      issuedToUserId: (o.issuedToUserId?._id || o.issuedToUserId)?.toString?.(),
      issuedToUser: issuedToUser ? { id: issuedToUser._id?.toString(), fullName: issuedToUser.fullName } : undefined,
      department: o.department,
      notes: o.notes,
      lines,
      createdAt: o.createdAt,
      tenantId: o.tenantId?.toString(),
    };
  }

  async issue(
    body: { issuedToUserId?: string; department?: string; notes?: string; lines: { itemId: string; quantity: number }[] },
    user: { id: string; tenantId: string },
  ) {
    const tid = toObjectId(user.tenantId);
    if (!tid) throw new BadRequestException('Invalid tenant ID');
    
    const distNumber = await this.nextDistributionNumber(user.tenantId);
    const created = await this.model.create({
      distributionNumber: distNumber,
      issuedToUserId: toObjectId(body.issuedToUserId) || undefined,
      department: body.department,
      notes: body.notes,
      tenantId: tid,
      lines: body.lines.map((l) => ({ itemId: toObjectId(l.itemId), quantity: l.quantity })),
    });
    for (const l of body.lines) {
      await this.inventory.addMovement(l.itemId, StockMovementType.ISSUE, l.quantity, {
        reference: 'distribution',
        referenceId: created._id.toString(),
        notes: body.notes,
        performedBy: user,
      });
    }
    return this.findOne(created._id.toString(), user.tenantId);
  }

  async findAll(tenantId: string) {
    const tid = toObjectId(tenantId);
    if (!tid) return [];
    
    const docs = await this.model.find({ tenantId: tid }).populate('issuedToUserId').populate('lines.itemId').sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => this.toDist(d));
  }

  async findOne(id: string, tenantId: string) {
    const tid = toObjectId(tenantId);
    const did = toObjectId(id);
    if (!tid || !did) throw new BadRequestException('Invalid IDs');

    const doc = await this.model.findOne({ _id: did, tenantId: tid })
      .populate('issuedToUserId').populate('lines.itemId').lean();
    if (!doc) throw new NotFoundException('Distribution not found');
    return this.toDist(doc);
  }

  async recordReturn(distributionId: string, tenantId: string, body: { itemId: string; quantity: number; notes?: string }, user: { id: string; tenantId: string }) {
    const tid = toObjectId(tenantId);
    if (!tid) throw new BadRequestException('Invalid tenant ID');

    const dist = await this.findOne(distributionId, tenantId);
    const hasItem = dist?.lines?.some((l: any) => l.itemId === body.itemId || (l.item && l.item.id === body.itemId));
    if (!hasItem) throw new BadRequestException('Item not in this distribution');
    await this.inventory.addMovement(body.itemId, StockMovementType.RETURN, body.quantity, {
      reference: 'distribution_return',
      referenceId: distributionId,
      notes: body.notes,
      performedBy: user,
    });
    return { success: true };
  }

  async recordDamage(body: { itemId: string; quantity: number; notes?: string }, user: { id: string; tenantId: string }) {
    if (!user?.tenantId) throw new BadRequestException('Tenant ID required');
    
    await this.inventory.addMovement(body.itemId, StockMovementType.DAMAGE, body.quantity, {
      reference: 'damage',
      notes: body.notes,
      performedBy: user,
    });
    return { success: true };
  }
}
