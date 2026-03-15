import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SaleDocument } from '../schemas/sale.schema';
import { ItemDocument } from '../schemas/item.schema';
import { ServiceDocument } from '../schemas/service.schema';
import { StockMovementType } from '../common/enums';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class ReceptionService {
  constructor(
    @InjectModel(SaleDocument.name)
    private saleModel: Model<SaleDocument>,
    @InjectModel(ItemDocument.name)
    private itemModel: Model<ItemDocument>,
    @InjectModel(ServiceDocument.name)
    private serviceModel: Model<ServiceDocument>,
    private inventory: InventoryService,
  ) {}

  private async nextSaleNumber(): Promise<string> {
    const last = await this.saleModel.findOne().sort({ soldAt: -1 }).lean();
    const num = last ? parseInt(String(last.saleNumber).replace(/\D/g, ''), 10) + 1 : 1;
    return `SAL-${String(num).padStart(6, '0')}`;
  }

  private toSale(doc: any) {
    if (!doc) return null;
    try {
      const o = doc.toObject ? doc.toObject() : doc;
      const lines = Array.isArray(o.lines)
        ? (o.lines as any[]).map((l: any) => ({
            id: l._id?.toString(),
            itemId: (l.itemId?._id || l.itemId)?.toString?.(),
            serviceId: (l.serviceId?._id || l.serviceId)?.toString?.(),
            item: l.itemId?.name ? { name: l.itemId.name, sku: l.itemId.sku } : undefined,
            service: l.serviceId?.name ? { name: l.serviceId.name } : undefined,
            quantity: Number(l.quantity) || 0,
            unitPrice: Number(l.unitPrice) || 0,
            total: Number(l.total) || 0,
          }))
        : [];
      const totalAmount = Number(o.totalAmount ?? 0);
      const amountPaidRaw = o.amountPaid;
      const amountPaid =
        amountPaidRaw !== undefined && amountPaidRaw !== null
          ? Number(amountPaidRaw)
          : totalAmount;
      const balanceDue = Math.max(0, totalAmount - amountPaid);
      return {
        id: (o._id || doc._id)?.toString(),
        saleNumber: o.saleNumber,
        soldAt: o.soldAt,
        soldById: (o.soldById?._id || o.soldById)?.toString?.(),
        soldBy: (o as any).soldById?.fullName,
        lines,
        totalAmount,
        amountPaid,
        balanceDue,
        customerName: o.customerName,
        notes: o.notes,
        paymentMethod: o.paymentMethod || 'cash',
      };
    } catch {
      return null;
    }
  }

  async sell(
    body: {
      lines: { itemId?: string; serviceId?: string; quantity: number; unitPrice: number }[];
      amountPaid?: number;
      customerName?: string;
      notes?: string;
      paymentMethod?: string;
    },
    user: { id: string },
  ) {
    if (!body.lines?.length) throw new BadRequestException('At least one line required');
    
    // Validate items have stock and selling price does not exceed original price
    for (const l of body.lines) {
      if (l.itemId) {
        const item = await this.itemModel.findById(l.itemId).select('name sku price').lean();
        if (!item) throw new BadRequestException('Item not found');
        const originalPrice = Number(item.price ?? 0);
        if (l.unitPrice > originalPrice) {
          const label = `${item.name} (${item.sku})`;
          throw new BadRequestException(
            `Selling price (${l.unitPrice.toFixed(2)}) cannot exceed original price (${originalPrice.toFixed(2)}) for ${label}`,
          );
        }
        const balance = await this.inventory.getBalance(l.itemId);
        if (balance < l.quantity) {
          const label = `${item.name} (${item.sku})`;
          throw new BadRequestException(`Insufficient stock for ${label}. Available: ${balance}, requested: ${l.quantity}`);
        }
      } else if (l.serviceId) {
        // Validate service exists and is active
        const service = await this.serviceModel.findById(l.serviceId).lean();
        if (!service || !service.isActive) {
          throw new BadRequestException(`Service not found or inactive`);
        }
      } else {
        throw new BadRequestException('Each line must have either itemId or serviceId');
      }
    }
    
    const saleNumber = await this.nextSaleNumber();
    const lines: { itemId?: Types.ObjectId; serviceId?: Types.ObjectId; quantity: number; unitPrice: number; unitCost?: number; total: number }[] = [];
    let totalAmount = 0;
    for (const l of body.lines) {
      const lineTotal = l.quantity * l.unitPrice; // selling price × qty for receipt
      let lineAmount: number;
      let unitCost = 0;
      if (l.itemId) {
        const item = await this.itemModel.findById(l.itemId).select('price costPrice').lean();
        lineAmount = (Number((item as any)?.price ?? 0)) * l.quantity; // use original price for sale total
        unitCost = Math.max(0, Number((item as any)?.costPrice ?? 0));
      } else {
        lineAmount = lineTotal;
      }
      const line: any = {
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        total: lineTotal,
      };
      if (l.itemId) {
        line.itemId = new Types.ObjectId(l.itemId);
        line.unitCost = unitCost;
      }
      if (l.serviceId) {
        const service = await this.serviceModel.findById(l.serviceId).select('costPrice').lean();
        line.serviceId = new Types.ObjectId(l.serviceId);
        line.unitCost = Math.max(0, Number((service as any)?.costPrice ?? 0));
      }
      lines.push(line);
      totalAmount += lineAmount;
    }

    const amountPaid = body.amountPaid != null
      ? Math.max(0, Math.min(Number(body.amountPaid), totalAmount))
      : totalAmount;

    const created = await this.saleModel.create({
      saleNumber,
      soldAt: new Date(),
      soldById: new Types.ObjectId(user.id),
      lines,
      totalAmount,
      amountPaid,
      customerName: body.customerName,
      notes: body.notes,
      paymentMethod: body.paymentMethod || 'cash',
    });

    for (const l of body.lines) {
      if (l.itemId) {
        await this.inventory.addMovement(l.itemId, StockMovementType.SALE, l.quantity, {
          reference: 'sale',
          referenceId: created._id.toString(),
          notes: body.customerName || undefined,
          performedBy: user,
        });
      }
    }

    return this.toSale(
      await this.saleModel
        .findById(created._id)
        .populate('lines.itemId')
        .populate('lines.serviceId')
        .populate('soldById')
        .lean(),
    );
  }

  async getTodaysSales() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const docs = await this.saleModel
      .find({ soldAt: { $gte: start } })
      .populate('lines.itemId', 'name sku')
      .populate('lines.serviceId', 'name')
      .populate('soldById', 'fullName')
      .sort({ soldAt: -1 })
      .lean();
    return docs.map((d: any) => this.toSale(d)).filter(Boolean);
  }

  async getUnpaidSales() {
    const docs = await this.saleModel
      .find({ $expr: { $lt: [{ $ifNull: ['$amountPaid', '$totalAmount'] }, '$totalAmount'] } })
      .populate('lines.itemId', 'name sku')
      .populate('lines.serviceId', 'name')
      .populate('soldById', 'fullName')
      .sort({ soldAt: -1 })
      .limit(50)
      .lean();
    return docs.map((d: any) => this.toSale(d)).filter(Boolean);
  }

  async getDashboard() {
    const [todaysSales, lowStock, unpaidSales] = await Promise.all([
      this.getTodaysSales(),
      this.inventory.getLowStockItems(),
      this.getUnpaidSales(),
    ]);
    const todayRevenue = todaysSales.reduce((sum, s) => sum + (s?.totalAmount ?? 0), 0);
    return {
      todaysSales,
      unpaidSales,
      todayRevenue,
      todayTransactionCount: todaysSales.length,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.slice(0, 5),
    };
  }

  async recordPayment(
    saleId: string,
    body: { amount: number; paymentMethod?: string },
    user: { id: string },
  ) {
    const sale = await this.saleModel.findById(saleId).lean();
    if (!sale) throw new BadRequestException('Sale not found');
    const totalAmount = Number(sale.totalAmount ?? 0);
    const currentPaid = Number((sale as any).amountPaid ?? totalAmount);
    const balanceDue = Math.max(0, totalAmount - currentPaid);
    const payAmount = Math.max(0, Number(body.amount));
    if (payAmount > balanceDue) {
      throw new BadRequestException(
        `Payment amount (${payAmount.toFixed(2)}) cannot exceed balance due (${balanceDue.toFixed(2)})`,
      );
    }
    if (payAmount <= 0) throw new BadRequestException('Payment amount must be greater than 0');
    const newAmountPaid = currentPaid + payAmount;
    await this.saleModel.updateOne(
      { _id: saleId },
      { $set: { amountPaid: newAmountPaid } },
    );
    return this.toSale(
      await this.saleModel.findById(saleId)
        .populate('lines.itemId')
        .populate('lines.serviceId')
        .populate('soldById')
        .lean(),
    );
  }
}
