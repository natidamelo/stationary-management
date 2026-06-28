import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreTransfersService } from './store-transfers.service';
import { StoreTransfersController } from './store-transfers.controller';
import { StoreTransferDocument, StoreTransferSchema } from '../schemas/store-transfer.schema';
import { StoreDocument, StoreSchema } from '../schemas/store.schema';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoreTransferDocument.name, schema: StoreTransferSchema },
      { name: StoreDocument.name, schema: StoreSchema },
    ]),
    InventoryModule,
  ],
  controllers: [StoreTransfersController],
  providers: [StoreTransfersService],
  exports: [StoreTransfersService],
})
export class StoreTransfersModule {}
