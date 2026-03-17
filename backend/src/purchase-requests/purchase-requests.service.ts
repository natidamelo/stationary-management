import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PurchaseRequestDocument } from '../schemas/purchase-request.schema';
import { RequestStatus } from '../common/enums';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { toObjectId } from '../common/utils';

@Injectable()
export class PurchaseRequestsService {
  constructor(
    @InjectModel(PurchaseRequestDocument.name)
    private model: Model<PurchaseRequestDocument>,
  ) {}

  private async nextRequestNumber(tenantId: string): Promise<string> {
    const tid = toObjectId(tenantId);
    if (!tid) return `PR-${Date.now()}`;
    const last = await this.model.findOne({ tenantId: tid }).sort({ createdAt: -1 }).lean();
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
      tenantId: o.tenantId?.toString(),
    };
  }

  async create(dto: CreatePurchaseRequestDto, user: { id: string; tenantId: string }) {
    const tid = toObjectId(user.tenantId);
    if (!tid) throw new BadRequestException('Tenant ID required');
    
    const requestNumber = await this.nextRequestNumber(user.tenantId);
    const created = await this.model.create({
      requestNumber,
      status: RequestStatus.DRAFT,
      requestedById: toObjectId(user.id),
      tenantId: tid,
      lines: dto.lines.map((l) => ({
        itemId: toObjectId(l.itemId),
        quantity: Number(l.quantity) || 1,
        reason: l.reason,
      })),
    });
    return this.findOne(created._id.toString(), user.tenantId);
  }

  async submit(id: string, user: { id: string; tenantId: string }) {
    const tid = toObjectId(user.tenantId);
    const prId = toObjectId(id);
    if (!tid || !prId) throw new BadRequestException('Invalid IDs');

    const pr = await this.findOne(id, user.tenantId);
    if (!pr || pr.requestedById !== user.id) throw new ForbiddenException('Not your request');
    if (pr.status !== RequestStatus.DRAFT) throw new BadRequestException('Only draft requests can be submitted');
    
    await this.model.updateOne(
      { _id: prId, tenantId: tid }, 
      { $set: { status: RequestStatus.PENDING } }
    );
    return this.findOne(id, user.tenantId);
  }

  async findAll(tenantId: string, filters?: { status?: RequestStatus; requestedBy?: string }) {
    const tid = toObjectId(tenantId);
    if (!tid) return [];
    
    const q: any = { tenantId: tid };
    if (filters?.status) q.status = filters.status;
    if (filters?.requestedBy) q.requestedById = toObjectId(filters.requestedBy);
    
    const docs = await this.model.find(q).populate('requestedById').populate('approvedById').populate('lines.itemId').sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => this.toPR(d));
  }

  async findOne(id: string, tenantId: string) {
    const tid = toObjectId(tenantId);
    const prId = toObjectId(id);
    if (!tid || !prId) throw new BadRequestException('Invalid IDs');

    const doc = await this.model.findOne({ _id: prId, tenantId: tid })
      .populate('requestedById').populate('approvedById').populate('lines.itemId').lean();
    if (!doc) throw new NotFoundException('Purchase request not found');
    return this.toPR(doc);
  }

  async approve(id: string, user: { id: string; tenantId: string }) {
    const tid = toObjectId(user.tenantId);
    const prId = toObjectId(id);
    if (!tid || !prId) throw new BadRequestException('Invalid IDs');

    const pr = await this.findOne(id, user.tenantId);
    if (!pr || pr.status !== RequestStatus.PENDING) throw new BadRequestException('Only pending requests can be approved');
    
    await this.model.updateOne(
      { _id: prId, tenantId: tid },
      { $set: { status: RequestStatus.APPROVED, approvedById: toObjectId(user.id), approvedAt: new Date() }, $unset: { rejectionReason: 1 } },
    );
    return this.findOne(id, user.tenantId);
  }

  async reject(id: string, user: { id: string; tenantId: string }, reason: string) {
    const tid = toObjectId(user.tenantId);
    const prId = toObjectId(id);
    if (!tid || !prId) throw new BadRequestException('Invalid IDs');

    const pr = await this.findOne(id, user.tenantId);
    if (!pr || pr.status !== RequestStatus.PENDING) throw new BadRequestException('Only pending requests can be rejected');
    
    await this.model.updateOne(
      { _id: prId, tenantId: tid },
      { $set: { status: RequestStatus.REJECTED, approvedById: toObjectId(user.id), approvedAt: new Date(), rejectionReason: reason } },
    );
    return this.findOne(id, user.tenantId);
  }
}
