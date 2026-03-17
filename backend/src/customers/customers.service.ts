import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomerDocument } from '../schemas/customer.schema';
import { toObjectId } from '../common/utils';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(CustomerDocument.name)
    private customerModel: Model<CustomerDocument>,
  ) {}

  async create(data: {
    name: string;
    email: string;
    contact?: string;
    address?: string;
    notes?: string;
  }, tenantId: string) {
    const tid = toObjectId(tenantId);
    if (!tid) throw new BadRequestException('Tenant ID is required');

    const existing = await this.customerModel.findOne({ 
      email: data.email.toLowerCase(),
      tenantId: tid
    }).lean();
    if (existing) {
      throw new BadRequestException('A customer with this email already exists.');
    }
    const created = await this.customerModel.create({
      name: data.name,
      email: data.email.toLowerCase(),
      contact: data.contact,
      address: data.address,
      notes: data.notes,
      tenantId: tid,
    });
    return this.findById(created._id.toString(), tenantId);
  }

  async findAll(tenantId: string) {
    const tid = toObjectId(tenantId);
    if (!tid) return [];
    const docs = await this.customerModel.find({ tenantId: tid }).sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => this.toCustomer(d));
  }

  async findById(id: string, tenantId: string) {
    const tid = toObjectId(tenantId);
    const cid = toObjectId(id);
    if (!tid || !cid) throw new BadRequestException('Invalid IDs');
    
    const doc = await this.customerModel.findOne({ _id: cid, tenantId: tid }).lean();
    if (!doc) throw new NotFoundException('Customer not found');
    return this.toCustomer(doc);
  }

  async update(id: string, data: Partial<{
    name: string;
    email: string;
    contact: string;
    address: string;
    notes: string;
  }>, tenantId: string) {
    const tid = toObjectId(tenantId);
    const cid = toObjectId(id);
    if (!tid || !cid) throw new BadRequestException('Invalid IDs');

    const doc = await this.customerModel.findOne({ _id: cid, tenantId: tid }).lean();
    if (!doc) throw new NotFoundException('Customer not found');
    
    if (data.email && data.email !== doc.email) {
      const existing = await this.customerModel.findOne({ 
        email: data.email.toLowerCase(),
        tenantId: tid
      }).lean();
      if (existing) throw new BadRequestException('A customer with this email already exists.');
    }
    await this.customerModel.updateOne(
      { _id: cid, tenantId: tid },
      { $set: { ...data, email: data.email?.toLowerCase(), updatedAt: new Date() } },
    );
    return this.findById(id, tenantId);
  }

  async delete(id: string, tenantId: string) {
    const tid = toObjectId(tenantId);
    const cid = toObjectId(id);
    if (!tid || !cid) throw new BadRequestException('Invalid IDs');

    const doc = await this.customerModel.findOne({ _id: cid, tenantId: tid }).lean();
    if (!doc) throw new NotFoundException('Customer not found');
    await this.customerModel.deleteOne({ _id: cid, tenantId: tid });
    return { success: true };
  }

  private toCustomer(doc: any) {
    return {
      id: doc._id?.toString(),
      name: doc.name,
      email: doc.email,
      contact: doc.contact,
      address: doc.address,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
