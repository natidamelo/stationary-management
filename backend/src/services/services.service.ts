import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceDocument } from '../schemas/service.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { toObjectId } from '../common/utils';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(ServiceDocument.name)
    private model: Model<ServiceDocument>,
  ) {}

  private toService(doc: any) {
    if (!doc) return null;
    const o = doc.toObject ? doc.toObject() : doc;
    return {
      id: (o._id || doc._id)?.toString(),
      name: o.name,
      description: o.description,
      costPrice: o.costPrice ?? 0,
      sellingPrice: o.sellingPrice ?? o.price ?? 0, // Support legacy price field
      isActive: o.isActive,
      createdAt: o.createdAt,
      tenantId: o.tenantId?.toString(),
    };
  }

  async create(dto: CreateServiceDto, tenantId: string) {
    const tid = toObjectId(tenantId);
    if (!tid) throw new BadRequestException('Tenant ID is required');
    
    const created = await this.model.create({ ...dto, tenantId: tid });
    return this.findOne(created._id.toString(), tenantId);
  }

  async findAll(tenantId: string) {
    const tid = toObjectId(tenantId);
    if (!tid) return [];
    
    const docs = await this.model.find({ tenantId: tid, isActive: { $ne: false } }).sort({ name: 1 }).lean();
    return docs.map((d: any) => this.toService(d)).filter(Boolean);
  }

  async findOne(id: string, tenantId: string) {
    const tid = toObjectId(tenantId);
    const sid = toObjectId(id);
    if (!tid || !sid) throw new BadRequestException('Invalid IDs');

    const doc = await this.model.findOne({ _id: sid, tenantId: tid }).lean();
    if (!doc) throw new NotFoundException('Service not found');
    return this.toService(doc);
  }

  async update(id: string, tenantId: string, dto: UpdateServiceDto) {
    const tid = toObjectId(tenantId);
    const sid = toObjectId(id);
    if (!tid || !sid) throw new BadRequestException('Invalid IDs');

    await this.findOne(id, tenantId);
    await this.model.updateOne({ _id: sid, tenantId: tid }, { $set: dto });
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const tid = toObjectId(tenantId);
    const sid = toObjectId(id);
    if (!tid || !sid) throw new BadRequestException('Invalid IDs');

    await this.findOne(id, tenantId);
    await this.model.updateOne({ _id: sid, tenantId: tid }, { $set: { isActive: false } });
    return this.findOne(id, tenantId);
  }
}
