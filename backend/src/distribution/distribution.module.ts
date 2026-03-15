import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DistributionDocument, DistributionSchema } from '../schemas/distribution.schema';
import { ItemDocument, ItemSchema } from '../schemas/item.schema';
import { UserDocument, UserSchema } from '../schemas/user.schema';
import { DistributionService } from './distribution.service';
import { DistributionController } from './distribution.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DistributionDocument.name, schema: DistributionSchema },
      { name: ItemDocument.name, schema: ItemSchema },
      { name: UserDocument.name, schema: UserSchema },
    ]),
    InventoryModule,
  ],
  providers: [DistributionService],
  controllers: [DistributionController],
  exports: [DistributionService],
})
export class DistributionModule {}
