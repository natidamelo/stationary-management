import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SupplierDocument } from '../schemas/supplier.schema';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { toObjectId } from '../common/utils';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(SupplierDocument.name)
    private model: Model<SupplierDocument>,
  ) {}

  private toSupp(doc: any) {
    if (!doc) return null;
    const o = doc.toObject ? doc.toObject() : doc;
    return { id: (o._id || doc._id)?.toString(), ...o };
  }

  async create(dto: CreateSupplierDto, tenantId: string) {
    const tid = toObjectId(tenantId);
    if (!tid) throw new BadRequestException('Tenant ID is required');
    const created = await this.model.create({ 
      ...dto,
      tenantId: tid
    });
    return this.findOne(created._id.toString(), tenantId);
  }

  async findAll(tenantId: string) {
    const tid = toObjectId(tenantId);
    if (!tid) return [];
    const docs = await this.model.find({ 
      tenantId: tid,
      isActive: { $ne: false } 
    }).sort({ name: 1 }).lean();
    return docs.map((d: any) => this.toSupp(d));
  }

  async findOne(id: string, tenantId: string) {
    const tid = toObjectId(tenantId);
    const sid = toObjectId(id);
    if (!tid || !sid) throw new BadRequestException('Invalid IDs');
    const doc = await this.model.findOne({ _id: sid, tenantId: tid }).lean();
    if (!doc) throw new NotFoundException('Supplier not found');
    return this.toSupp(doc);
  }

  async update(id: string, dto: UpdateSupplierDto, tenantId: string) {
    const tid = toObjectId(tenantId);
    const sid = toObjectId(id);
    if (!tid || !sid) throw new BadRequestException('Invalid IDs');
    await this.findOne(id, tenantId);
    await this.model.updateOne(
      { _id: sid, tenantId: tid }, 
      { $set: dto }
    );
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const tid = toObjectId(tenantId);
    const sid = toObjectId(id);
    if (!tid || !sid) throw new BadRequestException('Invalid IDs');
    await this.findOne(id, tenantId);
    await this.model.updateOne(
      { _id: sid, tenantId: tid }, 
      { $set: { isActive: false } }
    );
    return this.findOne(id, tenantId);
  }
}
