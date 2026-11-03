import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  MONETIZATION_CONFIG,
  CreditTransactionType,
  AdRewardKind,
  EarnStatusResponseDto,
  CheckinResponseDto,
  CheckinRestoreResponseDto,
  SpinResponseDto,
  AdRewardTicketResponseDto,
  ClaimAdRewardResponseDto,
  MilestoneConfigDto,
  getRewardDay,
} from "@palmsight/shared";
import { User, UserDocument } from "../schemas/user.schema";
import { Device, DeviceDocument } from "../schemas/device.schema";
import { AdReward, AdRewardDocument } from "../schemas/ad-reward.schema";
import { CreditLedgerService } from "./credit-ledger.service";

export const WHEEL_WEIGHTS = [40, 30, 18, 8, 3.5, 0.5]; // sum = 100

export function getSecondsUntilNextRewardDay(now: Date = new Date()): number {
  const todayStr = getRewardDay(now);
  const todayStart = new Date(`${todayStr}T00:00:00+07:00`).getTime();
  const nextDayStart = todayStart + 24 * 60 * 60 * 1000;
  const remainingMs = nextDayStart - now.getTime();
  return Math.max(0, Math.floor(remainingMs / 1000));
}

export function getDaysDiff(fromDay: string, toDay: string): number {
  const d1 = new Date(`${fromDay}T00:00:00+07:00`).getTime();
  const d2 = new Date(`${toDay}T00:00:00+07:00`).getTime();
  return Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
}

export function pickWheelPrizeIndex(): number {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (let i = 0; i < WHEEL_WEIGHTS.length; i++) {
    cumulative += WHEEL_WEIGHTS[i];
    if (rand < cumulative) {
      return i;
    }
  }
  return 0;
}

@Injectable()
export class EarnService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(AdReward.name)
    private readonly adRewardModel: Model<AdRewardDocument>,
    private readonly creditLedgerService: CreditLedgerService,
    private readonly configService: ConfigService
  ) {}

  private getMilestone(dayNumber: number): MilestoneConfigDto | undefined {
    return MONETIZATION_CONFIG.MILESTONES.find((m) => m.day === dayNumber);
  }

  private getNextMilestone(currentStreak: number): MilestoneConfigDto | null {
    const next = MONETIZATION_CONFIG.MILESTONES.find((m) => m.day > currentStreak);
    return next ? { day: next.day, bonus: next.bonus } : null;
  }

  private isVip(user: User): boolean {
    return !!(user.vipExpiresAt && new Date(user.vipExpiresAt) > new Date());
  }

  /**
   * GET /v1/currency/earn
   * Check-in state + streak + restore offer, wheel state, rewarded counters, gemSpinCost
   */
  async getEarnStatus(
    userId: Types.ObjectId,
    deviceId?: string
  ): Promise<EarnStatusResponseDto> {
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Người dùng không tồn tại.",
      });
    }

    const today = getRewardDay();
    const checkedInToday = user.checkinDay === today;

    let currentStreak = user.checkinStreak ?? 0;
    let missedDays = 0;
    let canRestore = false;
    let restoreCost = 0;
    let todayReward: number = MONETIZATION_CONFIG.CHECKIN_LADDER[0];

    if (checkedInToday) {
      todayReward =
        MONETIZATION_CONFIG.CHECKIN_LADDER[
          Math.max(0, currentStreak - 1) % MONETIZATION_CONFIG.CHECKIN_LADDER.length
        ];
    } else if (user.checkinDay) {
      const diff = getDaysDiff(user.checkinDay, today);
      if (diff === 1) {
        // Checked in yesterday; streak is intact
        const nextDayInStreak =
          (currentStreak % MONETIZATION_CONFIG.STREAK_LENGTH) + 1;
        todayReward =
          MONETIZATION_CONFIG.CHECKIN_LADDER[
            (nextDayInStreak - 1) % MONETIZATION_CONFIG.CHECKIN_LADDER.length
          ];
      } else if (diff > 1) {
        missedDays = diff - 1;
        if (
          missedDays <= MONETIZATION_CONFIG.RESTORE_MAX_MISSED &&
          currentStreak > 0
        ) {
          canRestore = true;
          restoreCost = missedDays * MONETIZATION_CONFIG.RESTORE_COST_PER_DAY;
        }
        todayReward = MONETIZATION_CONFIG.CHECKIN_LADDER[0];
      }
    }

    // Wheel free spin status
    let freeSpinsRemaining = user.lastSpinDay === today ? 0 : 1;
    if (freeSpinsRemaining > 0 && deviceId) {
      const device = await this.deviceModel.findOne({ deviceId });
      if (
        device &&
        device.lastSpinDay === today &&
        device.lastSpinUserId &&
        !device.lastSpinUserId.equals(userId)
      ) {
        freeSpinsRemaining = 0; // Device already used today by someone else
      }
    }

    // Ad rewards counters
    const userAdRewardsToday = await this.adRewardModel.find({
      userId,
      rewardDay: today,
      status: "rewarded",
    });

    const checkinDoubleCount = userAdRewardsToday.filter(
      (r) => r.kind === "checkin"
    ).length;
    const spinAdCount = userAdRewardsToday.filter((r) => r.kind === "spin").length;
    const bonusAdCount = userAdRewardsToday.filter(
      (r) => r.kind === "bonus"
    ).length;

    const doubleCheckedInToday = checkinDoubleCount >= MONETIZATION_CONFIG.CHECKIN_DOUBLE_CAP;
    const doubleCheckinAvailable = !doubleCheckedInToday;
    const adSpinsRemaining = Math.max(
      0,
      MONETIZATION_CONFIG.AD_SPINS - spinAdCount
    );
    const bonusAdsRemaining = Math.max(
      0,
      MONETIZATION_CONFIG.BONUS_AD_CAP - bonusAdCount
    );

    return {
      checkedInToday,
      currentStreak,
      todayReward,
      nextMilestone: this.getNextMilestone(currentStreak),
      canRestore,
      missedDays,
      restoreCost,
      doubleCheckedInToday,
      doubleCheckinAvailable,
      freeSpinsRemaining,
      adSpinsRemaining,
      currencySpinCost: MONETIZATION_CONFIG.CURRENCY_SPIN_COST,
      prizes: [...MONETIZATION_CONFIG.WHEEL_PRIZES],
      bonusAdsRemaining,
      bonusAdAmount: MONETIZATION_CONFIG.BONUS_AD_AMOUNT,
      rewardDay: today,
      secondsUntilNextDay: getSecondsUntilNextRewardDay(),
      balance: user.creditBalance ?? 0,
    };
  }

  /**
   * POST /v1/currency/checkin
   * Claim today; returns amount, streakDays, milestoneBonus
   */
  async checkin(
    userId: Types.ObjectId,
    deviceId?: string
  ): Promise<CheckinResponseDto> {
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Người dùng không tồn tại.",
      });
    }

    const today = getRewardDay();
    if (user.checkinDay === today) {
      throw new BadRequestException({
        code: "ALREADY_CHECKED_IN",
        message: "Bạn đã điểm danh hôm nay rồi.",
      });
    }

    // One-per-device rule (§2.2):
    // Daily check-in is once per reward day per account AND per device.
    // A second account on the same phone gets device_used.
    if (deviceId) {
      const device = await this.deviceModel.findOne({ deviceId });
      if (
        device &&
        device.lastCheckinDay === today &&
        device.lastCheckinUserId &&
        !device.lastCheckinUserId.equals(userId)
      ) {
        throw new ConflictException({
          code: "DEVICE_USED",
          message: "Thiết bị này đã được sử dụng để điểm danh hôm nay.",
        });
      }
    }

    // Calculate streak
    let newStreak = 1;
    if (user.checkinDay) {
      const diff = getDaysDiff(user.checkinDay, today);
      if (diff === 1) {
        newStreak = (user.checkinStreak % MONETIZATION_CONFIG.STREAK_LENGTH) + 1;
      } else {
        newStreak = 1;
      }
    }

    const ladderAmount =
      MONETIZATION_CONFIG.CHECKIN_LADDER[
        (newStreak - 1) % MONETIZATION_CONFIG.CHECKIN_LADDER.length
      ];
    const milestone = this.getMilestone(newStreak);
    const milestoneBonus = milestone ? milestone.bonus : 0;
    const totalReward = ladderAmount + milestoneBonus;

    // Credit ladder reward
    const creditRes = await this.creditLedgerService.credit(
      userId,
      ladderAmount,
      CreditTransactionType.CHECKIN,
      { note: `Daily check-in day ${newStreak}` }
    );

    let finalBalance = creditRes.balance;

    // Credit milestone bonus if applicable
    if (milestoneBonus > 0) {
      const bonusRes = await this.creditLedgerService.credit(
        userId,
        milestoneBonus,
        CreditTransactionType.CHECKIN_MILESTONE,
        { note: `Day ${newStreak} milestone bonus` }
      );
      finalBalance = bonusRes.balance;
    }

    // Update user
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          checkinDay: today,
          checkinStreak: newStreak,
        },
      }
    );

    // Update device
    if (deviceId) {
      await this.deviceModel.findOneAndUpdate(
        { deviceId },
        {
          $set: {
            lastCheckinDay: today,
            lastCheckinUserId: userId,
          },
        },
        { upsert: true }
      );
    }

    return {
      amount: ladderAmount,
      streakDays: newStreak,
      milestoneBonus,
      totalReward,
      balance: finalBalance,
      checkinDay: today,
    };
  }

  /**
   * POST /v1/currency/checkin/restore
   * VIP pays to keep the streak (vip_required, streak_not_restorable)
   */
  async restoreCheckin(
    userId: Types.ObjectId,
    deviceId?: string
  ): Promise<CheckinRestoreResponseDto> {
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Người dùng không tồn tại.",
      });
    }

    // Must be VIP
    if (!this.isVip(user)) {
      throw new ForbiddenException({
        code: "VIP_REQUIRED",
        message: "Tính năng khôi phục chuỗi chỉ dành riêng cho thành viên VIP.",
      });
    }

    const today = getRewardDay();
    if (user.checkinDay === today) {
      throw new BadRequestException({
        code: "ALREADY_CHECKED_IN",
        message: "Hôm nay bạn đã điểm danh rồi, không cần khôi phục.",
      });
    }

    if (!user.checkinDay) {
      throw new BadRequestException({
        code: "STREAK_NOT_RESTORABLE",
        message: "Chưa có chuỗi điểm danh nào để khôi phục.",
      });
    }

    const diff = getDaysDiff(user.checkinDay, today);
    const missedDays = diff - 1;

    if (
      missedDays < 1 ||
      missedDays > MONETIZATION_CONFIG.RESTORE_MAX_MISSED ||
      (user.checkinStreak ?? 0) === 0
    ) {
      throw new BadRequestException({
        code: "STREAK_NOT_RESTORABLE",
        message:
          "Chuỗi không thể khôi phục (đã lỡ quá số ngày quy định hoặc không bị gián đoạn).",
      });
    }

    const restoreCost = missedDays * MONETIZATION_CONFIG.RESTORE_COST_PER_DAY;
    if ((user.creditBalance ?? 0) < restoreCost) {
      throw new HttpException(
        {
          code: "INSUFFICIENT_CREDITS",
          message: `Cần ${restoreCost} GEM để khôi phục chuỗi điểm danh.`,
          details: { required: restoreCost, balance: user.creditBalance ?? 0 },
        },
        HttpStatus.PAYMENT_REQUIRED
      );
    }

    // Check device conflict if applicable
    if (deviceId) {
      const device = await this.deviceModel.findOne({ deviceId });
      if (
        device &&
        device.lastCheckinDay === today &&
        device.lastCheckinUserId &&
        !device.lastCheckinUserId.equals(userId)
      ) {
        throw new ConflictException({
          code: "DEVICE_USED",
          message: "Thiết bị này đã được sử dụng để điểm danh hôm nay.",
        });
      }
    }

    // 1. Debit restore cost
    await this.creditLedgerService.debit(
      userId,
      restoreCost,
      CreditTransactionType.CHECKIN_RESTORE,
      { note: `Restore streak for ${missedDays} missed days` }
    );

    // 2. Continues as day S + m + 1 (§7.2)
    const newStreak =
      ((user.checkinStreak + missedDays) % MONETIZATION_CONFIG.STREAK_LENGTH) + 1;
    const ladderAmount =
      MONETIZATION_CONFIG.CHECKIN_LADDER[
        (newStreak - 1) % MONETIZATION_CONFIG.CHECKIN_LADDER.length
      ];
    const milestone = this.getMilestone(newStreak);
    const milestoneBonus = milestone ? milestone.bonus : 0;

    // Credit today's checkin reward
    const checkinRes = await this.creditLedgerService.credit(
      userId,
      ladderAmount,
      CreditTransactionType.CHECKIN,
      { note: `Restored check-in day ${newStreak}` }
    );

    let finalBalance = checkinRes.balance;
    if (milestoneBonus > 0) {
      const bonusRes = await this.creditLedgerService.credit(
        userId,
        milestoneBonus,
        CreditTransactionType.CHECKIN_MILESTONE,
        { note: `Restored day ${newStreak} milestone bonus` }
      );
      finalBalance = bonusRes.balance;
    }

    // Update user
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          checkinDay: today,
          checkinStreak: newStreak,
        },
      }
    );

    // Update device
    if (deviceId) {
      await this.deviceModel.findOneAndUpdate(
        { deviceId },
        {
          $set: {
            lastCheckinDay: today,
            lastCheckinUserId: userId,
          },
        },
        { upsert: true }
      );
    }

    return {
      restored: true,
      cost: restoreCost,
      streakDays: newStreak,
      rewardAmount: ladderAmount,
      milestoneBonus,
      balance: finalBalance,
    };
  }

  /**
   * POST /v1/currency/spin
   * Free spin → prizeIndex
   */
  async spinFree(
    userId: Types.ObjectId,
    deviceId?: string
  ): Promise<SpinResponseDto> {
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Người dùng không tồn tại.",
      });
    }

    const today = getRewardDay();
    if (user.lastSpinDay === today) {
      throw new BadRequestException({
        code: "FREE_SPIN_USED",
        message: "Bạn đã sử dụng lượt quay miễn phí hôm nay rồi.",
      });
    }

    if (deviceId) {
      const device = await this.deviceModel.findOne({ deviceId });
      if (
        device &&
        device.lastSpinDay === today &&
        device.lastSpinUserId &&
        !device.lastSpinUserId.equals(userId)
      ) {
        throw new ConflictException({
          code: "DEVICE_USED",
          message: "Thiết bị này đã nhận lượt quay miễn phí hôm nay.",
        });
      }
    }

    const prizeIndex = pickWheelPrizeIndex();
    const amount = MONETIZATION_CONFIG.WHEEL_PRIZES[prizeIndex];

    const { balance } = await this.creditLedgerService.credit(
      userId,
      amount,
      CreditTransactionType.WHEEL,
      { note: `Wheel free spin prize: ${amount} GEM` }
    );

    await this.userModel.updateOne(
      { _id: userId },
      { $set: { lastSpinDay: today } }
    );

    if (deviceId) {
      await this.deviceModel.findOneAndUpdate(
        { deviceId },
        {
          $set: {
            lastSpinDay: today,
            lastSpinUserId: userId,
          },
        },
        { upsert: true }
      );
    }

    return {
      prizeIndex,
      amount,
      balance,
    };
  }

  /**
   * POST /v1/currency/paid-spin
   * Paid spin (gems_insufficient, free_spin_available)
   */
  async spinPaid(userId: Types.ObjectId): Promise<SpinResponseDto> {
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Người dùng không tồn tại.",
      });
    }

    const today = getRewardDay();
    if (user.lastSpinDay !== today) {
      throw new BadRequestException({
        code: "FREE_SPIN_AVAILABLE",
        message:
          "Bạn vẫn còn lượt quay miễn phí hôm nay, hãy dùng lượt miễn phí trước.",
      });
    }

    const cost = MONETIZATION_CONFIG.CURRENCY_SPIN_COST;
    if ((user.creditBalance ?? 0) < cost) {
      throw new HttpException(
        {
          code: "INSUFFICIENT_CREDITS",
          message: `Bạn cần ${cost} GEM để thực hiện lượt quay này.`,
          details: { required: cost, balance: user.creditBalance ?? 0 },
        },
        HttpStatus.PAYMENT_REQUIRED
      );
    }

    // Debit spin cost
    await this.creditLedgerService.debit(
      userId,
      cost,
      CreditTransactionType.WHEEL_SPIN,
      { note: "Paid wheel spin cost" }
    );

    const prizeIndex = pickWheelPrizeIndex();
    const amount = MONETIZATION_CONFIG.WHEEL_PRIZES[prizeIndex];

    const { balance } = await this.creditLedgerService.credit(
      userId,
      amount,
      CreditTransactionType.WHEEL,
      { note: `Paid wheel spin prize: ${amount} GEM` }
    );

    return {
      prizeIndex,
      amount,
      balance,
    };
  }

  /**
   * POST /v1/currency/ad-rewards
   * Create ticket {kind} (ad_reward_locked, ad_limit_reached, ads_unavailable)
   */
  async createAdRewardTicket(
    userId: Types.ObjectId,
    kind: AdRewardKind,
    deviceId?: string
  ): Promise<AdRewardTicketResponseDto> {
    const adsEnabled = this.configService.get<boolean>(
      "REWARDED_ADS_ENABLED",
      true
    );
    if (!adsEnabled) {
      throw new ServiceUnavailableException({
        code: "ADS_UNAVAILABLE",
        message: "Hệ thống quảng cáo hiện đang tạm ngưng.",
      });
    }

    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Người dùng không tồn tại.",
      });
    }

    const today = getRewardDay();

    // Check if user has an active pending ticket created recently (< 10m)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const pendingTicket = await this.adRewardModel.findOne({
      userId,
      status: "pending",
      createdAt: { $gte: tenMinutesAgo },
    });

    if (pendingTicket) {
      throw new ConflictException({
        code: "AD_REWARD_LOCKED",
        message: "Bạn đang có một vé quảng cáo chưa hoàn tất.",
      });
    }

    // Check limits according to kind
    let amount = 0;
    let prizeIndex: number | null = null;

    if (kind === "checkin") {
      // Must have checked in today
      if (user.checkinDay !== today) {
        throw new BadRequestException({
          code: "CHECKIN_REQUIRED",
          message: "Bạn cần hoàn tất điểm danh trước khi nhận x2 phần thưởng.",
        });
      }

      // Cap check
      const cap = MONETIZATION_CONFIG.CHECKIN_DOUBLE_CAP;
      const count = await this.countRewardedToday(userId, "checkin", today, deviceId);
      if (count >= cap) {
        throw new HttpException(
          {
            code: "AD_LIMIT_REACHED",
            message: "Hôm nay bạn đã đạt giới hạn nhận x2 điểm danh.",
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      const streak = user.checkinStreak || 1;
      amount =
        MONETIZATION_CONFIG.CHECKIN_LADDER[
          (streak - 1) % MONETIZATION_CONFIG.CHECKIN_LADDER.length
        ];
    } else if (kind === "spin") {
      // Free spin must be used first
      if (user.lastSpinDay !== today) {
        throw new BadRequestException({
          code: "FREE_SPIN_FIRST",
          message: "Hãy sử dụng lượt quay miễn phí trước khi xem quảng cáo.",
        });
      }

      const cap = MONETIZATION_CONFIG.AD_SPINS;
      const count = await this.countRewardedToday(userId, "spin", today, deviceId);
      if (count >= cap) {
        throw new HttpException(
          {
            code: "AD_LIMIT_REACHED",
            message: "Hôm nay bạn đã dùng hết lượt quay quảng cáo.",
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      prizeIndex = pickWheelPrizeIndex();
      amount = MONETIZATION_CONFIG.WHEEL_PRIZES[prizeIndex];
    } else if (kind === "bonus") {
      const cap = MONETIZATION_CONFIG.BONUS_AD_CAP;
      const count = await this.countRewardedToday(userId, "bonus", today, deviceId);
      if (count >= cap) {
        throw new HttpException(
          {
            code: "AD_LIMIT_REACHED",
            message: "Hôm nay bạn đã đạt giới hạn nhận coin từ quảng cáo.",
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      amount = MONETIZATION_CONFIG.BONUS_AD_AMOUNT;
    } else {
      throw new BadRequestException({
        code: "INVALID_AD_KIND",
        message: "Loại vé quảng cáo không hợp lệ.",
      });
    }

    const minWatchSeconds = Number(
      this.configService.get<number>(
        "MIN_AD_WATCH_SECONDS",
        MONETIZATION_CONFIG.MIN_AD_WATCH_SECONDS
      )
    );

    const doc = await this.adRewardModel.create({
      userId,
      deviceId: deviceId || null,
      kind,
      status: "pending",
      rewardDay: today,
      amount,
      prizeIndex,
    });

    return {
      id: doc._id.toString(),
      kind,
      amount,
      prizeIndex: prizeIndex !== null ? prizeIndex : undefined,
      minWatchSeconds,
      status: "pending",
      createdAt: doc.createdAt.toISOString(),
    };
  }

  /**
   * POST /v1/currency/ad-rewards/:id/claim
   * Claim after the ad (ad_not_finished + retryAfter) → rewarded / capped
   * Idempotent claims (§12)
   */
  async claimAdRewardTicket(
    userId: Types.ObjectId,
    ticketId: string
  ): Promise<ClaimAdRewardResponseDto> {
    if (!Types.ObjectId.isValid(ticketId)) {
      throw new BadRequestException({
        code: "INVALID_TICKET_ID",
        message: "Mã vé quảng cáo không hợp lệ.",
      });
    }

    const ticket = await this.adRewardModel.findOne({
      _id: new Types.ObjectId(ticketId),
      userId,
    });

    if (!ticket) {
      throw new NotFoundException({
        code: "TICKET_NOT_FOUND",
        message: "Không tìm thấy vé quảng cáo.",
      });
    }

    // Idempotent: already rewarded
    if (ticket.status === "rewarded") {
      const user = await this.userModel.findById(userId);
      return {
        status: "rewarded",
        amount: ticket.amount,
        prizeIndex:
          ticket.prizeIndex !== null && ticket.prizeIndex !== undefined
            ? ticket.prizeIndex
            : undefined,
        balance: user?.creditBalance ?? 0,
      };
    }

    if (ticket.status === "capped") {
      return { status: "capped" };
    }

    if (ticket.status === "released") {
      throw new BadRequestException({
        code: "TICKET_RELEASED",
        message: "Vé quảng cáo này đã bị huỷ.",
      });
    }

    // Enforce min ad watch time
    const minWatchSeconds = Number(
      this.configService.get<number>(
        "MIN_AD_WATCH_SECONDS",
        MONETIZATION_CONFIG.MIN_AD_WATCH_SECONDS
      )
    );
    const elapsedSeconds =
      (Date.now() - new Date(ticket.createdAt).getTime()) / 1000;

    if (elapsedSeconds < minWatchSeconds) {
      const retryAfter = Math.ceil(minWatchSeconds - elapsedSeconds);
      throw new HttpException(
        {
          code: "AD_NOT_FINISHED",
          message: "Quảng cáo chưa được xem đủ thời gian tối thiểu.",
          details: { retryAfter },
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // Re-verify cap at claim time under lock/check (§2.2)
    const cap = this.getCapForKind(ticket.kind);
    const count = await this.countRewardedToday(
      userId,
      ticket.kind,
      ticket.rewardDay,
      ticket.deviceId || undefined
    );

    if (count >= cap) {
      ticket.status = "capped";
      await ticket.save();
      return { status: "capped" };
    }

    // Mark as rewarded
    ticket.status = "rewarded";
    ticket.claimedAt = new Date();
    await ticket.save();

    // Credit currency
    const reason =
      ticket.kind === "spin"
        ? CreditTransactionType.WHEEL
        : CreditTransactionType.AD_REWARD;

    const { balance } = await this.creditLedgerService.credit(
      userId,
      ticket.amount,
      reason,
      { note: `Ad reward for ${ticket.kind}` }
    );

    return {
      status: "rewarded",
      amount: ticket.amount,
      prizeIndex:
        ticket.prizeIndex !== null && ticket.prizeIndex !== undefined
          ? ticket.prizeIndex
          : undefined,
      balance,
    };
  }

  /**
   * DELETE /v1/currency/ad-rewards/:id
   * Release an unused ticket
   */
  async releaseAdRewardTicket(
    userId: Types.ObjectId,
    ticketId: string
  ): Promise<{ ok: boolean }> {
    if (!Types.ObjectId.isValid(ticketId)) {
      throw new BadRequestException({
        code: "INVALID_TICKET_ID",
        message: "Mã vé quảng cáo không hợp lệ.",
      });
    }

    const ticket = await this.adRewardModel.findOne({
      _id: new Types.ObjectId(ticketId),
      userId,
    });

    if (ticket && ticket.status === "pending") {
      ticket.status = "released";
      await ticket.save();
    }

    return { ok: true };
  }

  private getCapForKind(kind: AdRewardKind): number {
    switch (kind) {
      case "checkin":
        return MONETIZATION_CONFIG.CHECKIN_DOUBLE_CAP;
      case "spin":
        return MONETIZATION_CONFIG.AD_SPINS;
      case "bonus":
        return MONETIZATION_CONFIG.BONUS_AD_CAP;
      default:
        return 0;
    }
  }

  private async countRewardedToday(
    userId: Types.ObjectId,
    kind: AdRewardKind,
    today: string,
    deviceId?: string
  ): Promise<number> {
    const userCount = await this.adRewardModel.countDocuments({
      userId,
      kind,
      rewardDay: today,
      status: "rewarded",
    });

    if (!deviceId) {
      return userCount;
    }

    const deviceCount = await this.adRewardModel.countDocuments({
      deviceId,
      kind,
      rewardDay: today,
      status: "rewarded",
    });

    return Math.max(userCount, deviceCount);
  }
}
