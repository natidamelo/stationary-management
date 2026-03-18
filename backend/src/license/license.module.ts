import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LicenseDocument, LicenseSchema } from '../schemas/license.schema';
import { CustomerDocument, CustomerSchema } from '../schemas/customer.schema';
import { TenantDocument, TenantSchema } from '../schemas/tenant.schema';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LicenseDocument.name, schema: LicenseSchema },
      { name: CustomerDocument.name, schema: CustomerSchema },
      { name: TenantDocument.name, schema: TenantSchema },
    ]),
  ],
  providers: [LicenseService],
  controllers: [LicenseController],
  exports: [LicenseService],
})
export class LicenseModule {}
