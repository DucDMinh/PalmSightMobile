import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AdRewardKind, AdRewardStatus } from '@palmsight/shared';

@Schema({
  collection: 'ad_rewards',
  timestamps: { createdAt: true, updatedAt: true },
})
export class AdReward {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, default: null, trim: true, index: true })
  deviceId?: string | null;

  @Prop({ type: String, required: true, enum: ['checkin', 'spin', 'bonus'] })
  kind: AdRewardKind;

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'rewarded', 'capped', 'released'],
    default: 'pending',
    index: true,
  })
  status: AdRewardStatus;

  @Prop({ type: String, required: true, trim: true, index: true })
  rewardDay: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Number, default: null })
  prizeIndex?: number | null;

  @Prop({ type: Date, default: null })
  claimedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export type AdRewardDocument = HydratedDocument<AdReward>;
export const AdRewardSchema = SchemaFactory.createForClass(AdReward);

// Indexes for fast lookup and cap verification (§2.2)
AdRewardSchema.index({ userId: 1, rewardDay: 1, kind: 1, status: 1 });
AdRewardSchema.index({ deviceId: 1, rewardDay: 1, kind: 1, status: 1 });
AdRewardSchema.index({ userId: 1, status: 1 });
// TTL index: auto-purge after 7 days
AdRewardSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
