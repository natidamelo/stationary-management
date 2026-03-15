import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceDocument } from '../schemas/service.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

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
    };
  }

  async create(dto: CreateServiceDto) {
    const created = await this.model.create(dto);
    return this.findOne(created._id.toString());
  }

  async findAll() {
    try {
      const docs = await this.model.find({ isActive: { $ne: false } }).sort({ name: 1 }).lean();
      return docs.map((d: any) => this.toService(d)).filter(Boolean);
    } catch {
      return [];
    }
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new NotFoundException('Service not found');
    return this.toService(doc);
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    await this.model.updateOne({ _id: id }, { $set: dto });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.model.updateOne({ _id: id }, { $set: { isActive: false } });
    return this.findOne(id);
  }
}
