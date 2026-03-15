import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseRequestDocument, PurchaseRequestSchema } from '../schemas/purchase-request.schema';
import { PurchaseOrderDocument, PurchaseOrderSchema } from '../schemas/purchase-order.schema';
import { ItemDocument, ItemSchema } from '../schemas/item.schema';
import { StockMovementDocument, StockMovementSchema } from '../schemas/stock-movement.schema';
import { SaleDocument, SaleSchema } from '../schemas/sale.schema';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseRequestDocument.name, schema: PurchaseRequestSchema },
      { name: PurchaseOrderDocument.name, schema: PurchaseOrderSchema },
      { name: ItemDocument.name, schema: ItemSchema },
      { name: StockMovementDocument.name, schema: StockMovementSchema },
      { name: SaleDocument.name, schema: SaleSchema },
    ]),
    InventoryModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
