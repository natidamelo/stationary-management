import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'tenants' })
export class TenantDocument extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const TenantSchema = SchemaFactory.createForClass(TenantDocument);
