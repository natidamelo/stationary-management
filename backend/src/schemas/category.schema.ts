import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'categories' })
export class CategoryDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'TenantDocument', required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;
}

export const CategorySchema = SchemaFactory.createForClass(CategoryDocument);
CategorySchema.index({ name: 1, tenantId: 1 }, { unique: true, name: 'idx_category_name_tenant_v2' });
