import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockMovementDocument, StockMovementSchema } from '../schemas/stock-movement.schema';
import { ItemDocument, ItemSchema } from '../schemas/item.schema';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockMovementDocument.name, schema: StockMovementSchema },
      { name: ItemDocument.name, schema: ItemSchema },
    ]),
  ],
  providers: [InventoryService],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
