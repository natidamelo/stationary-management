import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class StoreTransferLineDoc {
  @Prop({ type: Types.ObjectId, ref: 'ItemDocument', required: true })
  itemId: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;
}

const StoreTransferLineSchema = SchemaFactory.createForClass(StoreTransferLineDoc);

@Schema({ collection: 'store_transfers' })
export class StoreTransferDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'TenantDocument', required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  transferNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'StoreDocument', required: true })
  fromStoreId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StoreDocument', required: true })
  toStoreId: Types.ObjectId;

  @Prop({ default: 'pending' })
  status: string; // 'pending' | 'completed'

  @Prop()
  notes: string;

  @Prop({ type: [StoreTransferLineSchema], default: [] })
  lines: StoreTransferLineDoc[];

  @Prop({ type: Types.ObjectId, ref: 'UserDocument', required: true })
  createdById: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  completedAt: Date;
}

export const StoreTransferSchema = SchemaFactory.createForClass(StoreTransferDocument);
StoreTransferSchema.index({ tenantId: 1, transferNumber: 1 }, { unique: true });
