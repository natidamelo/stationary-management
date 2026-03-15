import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseRequestDocument, PurchaseRequestSchema } from '../schemas/purchase-request.schema';
import { ItemDocument, ItemSchema } from '../schemas/item.schema';
import { PurchaseRequestsService } from './purchase-requests.service';
import { PurchaseRequestsController } from './purchase-requests.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseRequestDocument.name, schema: PurchaseRequestSchema },
      { name: ItemDocument.name, schema: ItemSchema },
    ]),
  ],
  providers: [PurchaseRequestsService],
  controllers: [PurchaseRequestsController],
  exports: [PurchaseRequestsService],
})
export class PurchaseRequestsModule {}
