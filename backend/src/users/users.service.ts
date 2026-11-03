import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as crypto from "crypto";
import {
  MeResponseDto,
  MONETIZATION_CONFIG,
  CreditTransactionType,
  getRewardDay,
} from "@palmsight/shared";
import { User, UserDocument } from "../schemas/user.schema";
import { Referral, ReferralDocument } from "../schemas/referral.schema";
import { CreditLedgerService } from "../credits/credit-ledger.service";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Referral.name)
    private readonly referralModel: Model<ReferralDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly creditLedgerService: CreditLedgerService,
    private readonly configService: ConfigService
  ) {}

  generateBillingRef(userId: string): string {
    const secret =
      this.configService.get<string>("BILLING_SECRET") ||
      this.configService.get<string>("JWT_ACCESS_SECRET") ||
      "palmsight-billing-secret";
    return crypto.createHmac("sha256", secret).update(userId).digest("hex");
  }

  async getMe(user: UserDocument): Promise<MeResponseDto> {
    const enteredReferral = await this.referralModel
      .findOne({ refereeId: user._id })
      .lean();
    const baseUrl = this.configService
      .get<string>("PUBLIC_BASE_URL", "http://localhost:5173")
      .replace(/\/+$/, "");

    // 1. BillingRef (§2.2, §6.5)
    let billingRef = user.billingRef;
    if (!billingRef) {
      billingRef = this.generateBillingRef(user._id.toString());
      await this.userModel.updateOne(
        { _id: user._id },
        { $set: { billingRef } }
      );
      user.billingRef = billingRef;
    }

    // 2. VIP status (§2.2, §6.1, §6.2)
    const isVip = Boolean(
      user.vipExpiresAt && new Date(user.vipExpiresAt) > new Date()
    );

    let currentBalance = user.creditBalance;
    let grantedNow = 0;

    // 3. VIP daily grant (§2.2, §6.6):
    // Granted on the first /v1/me of the reward day
    if (isVip) {
      const today = getRewardDay();
      if (user.vipDailyDay !== today) {
        const updated = await this.userModel.findOneAndUpdate(
          { _id: user._id, vipDailyDay: { $ne: today } },
          { $set: { vipDailyDay: today } },
          { new: true }
        );

        if (updated) {
          const vipDailyAmount = Number(
            this.configService.get<number>(
              "VIP_DAILY",
              MONETIZATION_CONFIG.VIP_DAILY
            )
          );

          const creditRes = await this.creditLedgerService.credit(
            user._id,
            vipDailyAmount,
            CreditTransactionType.VIP_DAILY,
            { note: `VIP Daily Grant for ${today}` }
          );

          user.vipDailyDay = today;
          user.creditBalance = creditRes.balance;
          currentBalance = creditRes.balance;
          grantedNow = vipDailyAmount;
        }
      }
    }

    return {
      id: user._id.toString(),
      displayName: user.displayName,
      username: user.username ?? null,
      email: user.email ?? null,
      avatarUrl: user.avatarUrl ?? null,
      creditBalance: currentBalance,
      balance: currentBalance,
      referralCode: user.referralCode,
      referralLink: `${baseUrl}/r/${user.referralCode}`,
      hasPassword: Boolean(user.passwordHash),
      providers: (user.identities ?? []).map((identity) => identity.provider),
      referral: {
        canEnterCode: !enteredReferral && !user.referralBlocked,
        enteredCode: enteredReferral?.codeUsed ?? null,
      },
      vip: {
        active: isVip,
        productId: isVip ? user.vipProductId ?? null : null,
        expiresAt: user.vipExpiresAt
          ? new Date(user.vipExpiresAt).toISOString()
          : null,
        willRenew: isVip ? Boolean(user.vipWillRenew) : false,
      },
      billingRef,
      grantedNow,
    };
  }
}
