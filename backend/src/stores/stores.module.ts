import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { StoreDocument, StoreSchema } from '../schemas/store.schema';
import { UserDocument, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoreDocument.name, schema: StoreSchema },
      { name: UserDocument.name, schema: UserSchema },
    ]),
  ],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
