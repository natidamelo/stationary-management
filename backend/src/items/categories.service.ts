import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CategoryDocument } from '../schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(CategoryDocument.name)
    private model: Model<CategoryDocument>,
  ) {}

  private toCat(doc: any) {
    if (!doc) return null;
    const o = doc.toObject ? doc.toObject() : doc;
    return { id: (o._id || doc._id)?.toString(), ...o };
  }

  async create(name: string, description?: string) {
    const created = await this.model.create({ name, description });
    return this.toCat(await this.model.findById(created._id).lean());
  }

  async findAll() {
    const docs = await this.model.find().sort({ name: 1 }).lean();
    return docs.map((d: any) => this.toCat(d));
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new NotFoundException('Category not found');
    return this.toCat(doc);
  }

  async update(id: string, data: { name?: string; description?: string }) {
    await this.findOne(id);
    await this.model.updateOne({ _id: new Types.ObjectId(id) }, { $set: data });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.model.deleteOne({ _id: new Types.ObjectId(id) });
    return { deleted: true };
  }
}
