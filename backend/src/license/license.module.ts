import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LicenseDocument, LicenseSchema } from '../schemas/license.schema';
import { CustomerDocument, CustomerSchema } from '../schemas/customer.schema';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LicenseDocument.name, schema: LicenseSchema },
      { name: CustomerDocument.name, schema: CustomerSchema },
    ]),
  ],
  providers: [LicenseService],
  controllers: [LicenseController],
  exports: [LicenseService],
})
export class LicenseModule {}
