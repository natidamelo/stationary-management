import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StoreTransferDocument } from '../schemas/store-transfer.schema';
import { StoreDocument } from '../schemas/store.schema';
import { StockMovementType } from '../common/enums';
import { InventoryService } from '../inventory/inventory.service';
import { CreateStoreTransferDto } from './dto/create-store-transfer.dto';
import { toObjectId } from '../common/utils';

@Injectable()
export class StoreTransfersService {
  constructor(
    @InjectModel(StoreTransferDocument.name)
    private transferModel: Model<StoreTransferDocument>,
    @InjectModel(StoreDocument.name)
    private storeModel: Model<StoreDocument>,
    private inventory: InventoryService,
  ) {}

  private async nextTransferNumber(tenantId: string): Promise<string> {
    const cleanTenantId = (tenantId || '').trim();
    const tid = toObjectId(cleanTenantId);
    if (!tid && !cleanTenantId) return `TR-${Date.now()}`;
    
    const count = await this.transferModel.countDocuments({
      tenantId: tid || cleanTenantId,
    });
    const num = count + 1;
    return `TR-${String(num).padStart(5, '0')}`;
  }

  private toTransfer(doc: any) {
    if (!doc) return null;
    const o = doc.toObject ? doc.toObject() : doc;
    const fromStore = o.fromStoreId;
    const toStore = o.toStoreId;
    const createdBy = o.createdById;
    
    const lines = (o.lines || []).map((l: any) => ({
      id: l._id?.toString(),
      itemId: (l.itemId?._id || l.itemId)?.toString?.(),
      item: l.itemId?.name ? { name: l.itemId.name, sku: l.itemId.sku } : undefined,
      quantity: l.quantity,
    }));

    return {
      id: (o._id || doc._id)?.toString(),
      transferNumber: o.transferNumber,
      fromStoreId: (fromStore?._id || fromStore)?.toString?.(),
      fromStore: fromStore?.name ? { name: fromStore.name } : undefined,
      toStoreId: (toStore?._id || toStore)?.toString?.(),
      toStore: toStore?.name ? { name: toStore.name } : undefined,
      status: o.status,
      notes: o.notes,
      lines,
      createdBy: createdBy ? { fullName: createdBy.fullName } : undefined,
      createdAt: o.createdAt,
      completedAt: o.completedAt,
      tenantId: o.tenantId?.toString(),
    };
  }

  async create(dto: CreateStoreTransferDto, user: { id: string; tenantId: string }): Promise<any> {
    const tid = toObjectId(user.tenantId);
    const fromSid = toObjectId(dto.fromStoreId);
    const toSid = toObjectId(dto.toStoreId);
    if (!tid || !fromSid || !toSid) throw new BadRequestException('Invalid IDs');

    if (dto.fromStoreId === dto.toStoreId) {
      throw new BadRequestException('Source and destination stores must be different');
    }

    // Verify stores exist and belong to tenant
    const [fromStore, toStore] = await Promise.all([
      this.storeModel.findOne({ _id: fromSid, tenantId: tid }).lean(),
      this.storeModel.findOne({ _id: toSid, tenantId: tid }).lean(),
    ]);

    if (!fromStore || !toStore) {
      throw new NotFoundException('One of the specified stores was not found');
    }

    const transferNumber = await this.nextTransferNumber(user.tenantId);
    const created = await this.transferModel.create({
      tenantId: tid,
      transferNumber,
      fromStoreId: fromSid,
      toStoreId: toSid,
      status: 'pending',
      notes: dto.notes,
      lines: dto.lines.map((l) => ({
        itemId: toObjectId(l.itemId),
        quantity: l.quantity,
      })),
      createdById: toObjectId(user.id),
    });

    return this.findOne(created._id.toString(), user.tenantId);
  }

  async findAll(tenantId: string): Promise<any[]> {
    const tid = toObjectId(tenantId);
    if (!tid) return [];
    const docs = await this.transferModel
      .find({ tenantId: tid })
      .populate('fromStoreId')
      .populate('toStoreId')
      .populate('createdById')
      .populate('lines.itemId')
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((d: any) => this.toTransfer(d)).filter(Boolean);
  }

  async findOne(id: string, tenantId: string): Promise<any> {
    const tid = toObjectId(tenantId);
    const trId = toObjectId(id);
    if (!tid || !trId) throw new BadRequestException('Invalid ID format');

    const doc = await this.transferModel
      .findOne({ _id: trId, tenantId: tid })
      .populate('fromStoreId')
      .populate('toStoreId')
      .populate('createdById')
      .populate('lines.itemId')
      .lean();
    if (!doc) throw new NotFoundException('Store transfer not found');
    return this.toTransfer(doc);
  }

  async complete(id: string, user: { id: string; tenantId: string }): Promise<any> {
    const tid = toObjectId(user.tenantId);
    const trId = toObjectId(id);
    if (!tid || !trId) throw new BadRequestException('Invalid ID format');

    const transferDoc = await this.transferModel.findOne({ _id: trId, tenantId: tid });
    if (!transferDoc) throw new NotFoundException('Store transfer not found');

    if (transferDoc.status !== 'pending') {
      throw new BadRequestException('This transfer is already completed or cancelled');
    }

    // 1. Validate stock levels in the source store first
    for (const line of transferDoc.lines) {
      const balance = await this.inventory.getBalance(
        line.itemId.toString(),
        user.tenantId,
        transferDoc.fromStoreId.toString(),
      );
      if (balance < line.quantity) {
        throw new BadRequestException(
          `Insufficient stock at the source store for item ID ${line.itemId}. Available: ${balance}, Requested: ${line.quantity}`,
        );
      }
    }

    // 2. Perform the stock movements
    for (const line of transferDoc.lines) {
      // Out of fromStore
      await this.inventory.addMovement(
        line.itemId.toString(),
        StockMovementType.TRANSFER_OUT,
        line.quantity,
        {
          reference: 'store_transfer',
          referenceId: id,
          notes: `Transfer Out to Store: ${transferDoc.toStoreId}`,
          performedBy: {
            id: user.id,
            tenantId: user.tenantId,
            storeId: transferDoc.fromStoreId.toString(),
          },
        },
      );

      // Into toStore
      await this.inventory.addMovement(
        line.itemId.toString(),
        StockMovementType.TRANSFER_IN,
        line.quantity,
        {
          reference: 'store_transfer',
          referenceId: id,
          notes: `Transfer In from Store: ${transferDoc.fromStoreId}`,
          performedBy: {
            id: user.id,
            tenantId: user.tenantId,
            storeId: transferDoc.toStoreId.toString(),
          },
        },
      );
    }

    // 3. Mark completed
    transferDoc.status = 'completed';
    transferDoc.completedAt = new Date();
    await transferDoc.save();

    return this.findOne(id, user.tenantId);
  }
}
