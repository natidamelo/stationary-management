import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'stores' })
export class StoreDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'TenantDocument', required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  location: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const StoreSchema = SchemaFactory.createForClass(StoreDocument);
StoreSchema.index({ tenantId: 1, name: 1 }, { unique: true });
