import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({
  collection: 'devices',
  timestamps: true,
})
export class Device {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  deviceId: string;

  @Prop({ type: Boolean, default: false })
  starterGranted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  starterUserId?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  starterGrantedAt?: Date | null;

  @Prop({ type: String, default: null, trim: true })
  ipHash?: string | null;

  @Prop({ type: String, default: null, trim: true })
  lastCheckinDay?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  lastCheckinUserId?: Types.ObjectId | null;

  @Prop({ type: String, default: null, trim: true })
  lastSpinDay?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  lastSpinUserId?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export type DeviceDocument = HydratedDocument<Device>;
export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.index({ deviceId: 1 }, { unique: true });
DeviceSchema.index({ ipHash: 1, starterGrantedAt: 1 });
