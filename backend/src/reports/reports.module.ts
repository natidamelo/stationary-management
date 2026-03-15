import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemDocument, ItemSchema } from '../schemas/item.schema';
import { StockMovementDocument, StockMovementSchema } from '../schemas/stock-movement.schema';
import { SaleDocument, SaleSchema } from '../schemas/sale.schema';
import { PurchaseOrderDocument, PurchaseOrderSchema } from '../schemas/purchase-order.schema';
import { DistributionDocument, DistributionSchema } from '../schemas/distribution.schema';
import { CategoryDocument, CategorySchema } from '../schemas/category.schema';
import { SupplierDocument, SupplierSchema } from '../schemas/supplier.schema';
import { UserDocument, UserSchema } from '../schemas/user.schema';
import { OperatingExpenseDocument, OperatingExpenseSchema } from '../schemas/operating-expense.schema';
import { ServiceDocument, ServiceSchema } from '../schemas/service.schema';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ItemDocument.name, schema: ItemSchema },
      { name: OperatingExpenseDocument.name, schema: OperatingExpenseSchema },
      { name: StockMovementDocument.name, schema: StockMovementSchema },
      { name: SaleDocument.name, schema: SaleSchema },
      { name: PurchaseOrderDocument.name, schema: PurchaseOrderSchema },
      { name: DistributionDocument.name, schema: DistributionSchema },
      { name: CategoryDocument.name, schema: CategorySchema },
      { name: SupplierDocument.name, schema: SupplierSchema },
      { name: UserDocument.name, schema: UserSchema },
      { name: ServiceDocument.name, schema: ServiceSchema },
    ]),
    InventoryModule,
  ],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
