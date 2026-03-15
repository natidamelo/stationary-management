import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemDocument, ItemSchema } from '../schemas/item.schema';
import { SupplierDocument, SupplierSchema } from '../schemas/supplier.schema';
import { PurchaseOrderDocument, PurchaseOrderSchema } from '../schemas/purchase-order.schema';
import { PurchaseRequestDocument, PurchaseRequestSchema } from '../schemas/purchase-request.schema';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ItemDocument.name, schema: ItemSchema },
      { name: SupplierDocument.name, schema: SupplierSchema },
      { name: PurchaseOrderDocument.name, schema: PurchaseOrderSchema },
      { name: PurchaseRequestDocument.name, schema: PurchaseRequestSchema },
    ]),
  ],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
