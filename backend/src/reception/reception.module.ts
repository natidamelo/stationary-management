import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SaleDocument, SaleSchema } from '../schemas/sale.schema';
import { ItemDocument, ItemSchema } from '../schemas/item.schema';
import { ServiceDocument, ServiceSchema } from '../schemas/service.schema';
import { UserDocument, UserSchema } from '../schemas/user.schema';
import { ReceptionService } from './reception.service';
import { ReceptionController } from './reception.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaleDocument.name, schema: SaleSchema },
      { name: ItemDocument.name, schema: ItemSchema },
      { name: ServiceDocument.name, schema: ServiceSchema },
      { name: UserDocument.name, schema: UserSchema },
    ]),
    InventoryModule,
  ],
  providers: [ReceptionService],
  controllers: [ReceptionController],
  exports: [ReceptionService],
})
export class ReceptionModule {}
