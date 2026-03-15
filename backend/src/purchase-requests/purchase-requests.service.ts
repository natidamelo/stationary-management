import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PurchaseRequestDocument } from '../schemas/purchase-request.schema';
import { RequestStatus } from '../common/enums';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';

@Injectable()
export class PurchaseRequestsService {
  constructor(
    @InjectModel(PurchaseRequestDocument.name)
    private model: Model<PurchaseRequestDocument>,
  ) {}

  private async nextRequestNumber(): Promise<string> {
    const last = await this.model.findOne().sort({ createdAt: -1 }).lean();
    const num = last ? parseInt(String(last.requestNumber).replace(/\D/g, ''), 10) + 1 : 1;
    return `PR-${String(num).padStart(6, '0')}`;
  }

  private toPR(doc: any) {
    if (!doc) return null;
    const o = doc.toObject ? doc.toObject() : doc;
    const requestedBy = (o as any).requestedById;
    const approvedBy = (o as any).approvedById;
    const lines = (o.lines || []).map((l: any) => ({
      id: l._id?.toString(),
      itemId: (l.itemId?._id || l.itemId)?.toString?.(),
      item: l.itemId?.name ? { name: l.itemId.name, sku: l.itemId.sku } : undefined,
      quantity: l.quantity,
      reason: l.reason,
    }));
    return {
      id: (o._id || doc._id)?.toString(),
      requestNumber: o.requestNumber,
      status: o.status,
      requestedById: (o.requestedById?._id || o.requestedById)?.toString?.(),
      requestedBy: requestedBy ? { id: requestedBy._id?.toString(), fullName: requestedBy.fullName, email: requestedBy.email } : undefined,
      approvedById: (o.approvedById?._id || o.approvedById)?.toString?.(),
      approvedBy: approvedBy ? { fullName: approvedBy.fullName } : undefined,
      approvedAt: o.approvedAt,
      rejectionReason: o.rejectionReason,
      lines,
      createdAt: o.createdAt,
    };
  }

  async create(dto: CreatePurchaseRequestDto, user: { id: string }) {
    const requestNumber = await this.nextRequestNumber();
    const created = await this.model.create({
      requestNumber,
      status: RequestStatus.DRAFT,
      requestedById: new Types.ObjectId(user.id),
      lines: dto.lines.map((l) => ({
        itemId: new Types.ObjectId(l.itemId),
        quantity: Number(l.quantity) || 1,
        reason: l.reason,
      })),
    });
    return this.findOne(created._id.toString());
  }

  async submit(id: string, user: { id: string }) {
    const pr = await this.findOne(id);
    if (!pr || pr.requestedById !== user.id) throw new ForbiddenException('Not your request');
    if (!pr || pr.status !== RequestStatus.DRAFT) throw new BadRequestException('Only draft requests can be submitted');
    await this.model.updateOne({ _id: new Types.ObjectId(id) }, { $set: { status: RequestStatus.PENDING } });
    return this.findOne(id);
  }

  async findAll(filters?: { status?: RequestStatus; requestedBy?: string }) {
    const q: any = {};
    if (filters?.status) q.status = filters.status;
    if (filters?.requestedBy) q.requestedById = new Types.ObjectId(filters.requestedBy);
    const docs = await this.model.find(q).populate('requestedById').populate('approvedById').populate('lines.itemId').sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => this.toPR(d));
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).populate('requestedById').populate('approvedById').populate('lines.itemId').lean();
    if (!doc) throw new NotFoundException('Purchase request not found');
    return this.toPR(doc);
  }

  async approve(id: string, user: { id: string }) {
    const pr = await this.findOne(id);
    if (!pr || pr.status !== RequestStatus.PENDING) throw new BadRequestException('Only pending requests can be approved');
    await this.model.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { status: RequestStatus.APPROVED, approvedById: new Types.ObjectId(user.id), approvedAt: new Date() }, $unset: { rejectionReason: 1 } },
    );
    return this.findOne(id);
  }

  async reject(id: string, user: { id: string }, reason: string) {
    const pr = await this.findOne(id);
    if (!pr || pr.status !== RequestStatus.PENDING) throw new BadRequestException('Only pending requests can be rejected');
    await this.model.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { status: RequestStatus.REJECTED, approvedById: new Types.ObjectId(user.id), approvedAt: new Date(), rejectionReason: reason } },
    );
    return this.findOne(id);
  }
}
