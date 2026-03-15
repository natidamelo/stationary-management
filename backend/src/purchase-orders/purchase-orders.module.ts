import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseOrderDocument, PurchaseOrderSchema } from '../schemas/purchase-order.schema';
import { ItemDocument, ItemSchema } from '../schemas/item.schema';
import { SupplierDocument, SupplierSchema } from '../schemas/supplier.schema';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseOrderDocument.name, schema: PurchaseOrderSchema },
      { name: ItemDocument.name, schema: ItemSchema },
      { name: SupplierDocument.name, schema: SupplierSchema },
    ]),
    InventoryModule,
  ],
  providers: [PurchaseOrdersService],
  controllers: [PurchaseOrdersController],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
