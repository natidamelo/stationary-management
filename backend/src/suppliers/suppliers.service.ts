import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SupplierDocument } from '../schemas/supplier.schema';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

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

  async create(dto: CreateSupplierDto) {
    const created = await this.model.create(dto);
    return this.toSupp(await this.model.findById(created._id).lean());
  }

  async findAll() {
    const docs = await this.model.find().sort({ name: 1 }).lean();
    return docs.map((d: any) => this.toSupp(d));
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new NotFoundException('Supplier not found');
    return this.toSupp(doc);
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    await this.model.updateOne({ _id: new Types.ObjectId(id) }, { $set: dto });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.model.updateOne({ _id: new Types.ObjectId(id) }, { $set: { isActive: false } });
    return this.findOne(id);
  }
}
