import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, ClientSession, FilterQuery } from "mongoose";
import * as crypto from "crypto";
import {
  CreditTransaction,
  CreditTransactionDocument,
} from "../schemas/credit-transaction.schema";
import { User, UserDocument } from "../schemas/user.schema";
import { Device, DeviceDocument } from "../schemas/device.schema";
import {
  CreditTransactionType,
  CREDIT_AMOUNTS,
  MONETIZATION_CONFIG,
  CreditTransactionListResponseDto,
  PaginationQueryDto,
  getRewardDay,
} from "@palmsight/shared";

export interface RecordCreditTransactionDto {
  userId: Types.ObjectId;
  amount: number;
  type: CreditTransactionType;
  balanceAfter: number;
  readingId?: Types.ObjectId;
  referralId?: Types.ObjectId;
  note?: string;
}

export interface CreditDebitOptions {
  readingId?: Types.ObjectId;
  referralId?: Types.ObjectId;
  note?: string;
  session?: ClientSession;
}

export interface StarterGrantOptions {
  deviceId?: string;
  ip?: string;
  session?: ClientSession;
}

export interface StarterGrantResult {
  granted: boolean;
  amount: number;
  reason?: string;
}

@Injectable()
export class CreditLedgerService {
  constructor(
    @InjectModel(CreditTransaction.name)
    private readonly creditTransactionModel: Model<CreditTransactionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    private readonly configService: ConfigService
  ) {}

  /**
   * Raw record helper (preserves backward compatibility with existing code)
   */
  async recordWithSession(
    dto: RecordCreditTransactionDto,
    session: ClientSession
  ): Promise<CreditTransactionDocument> {
    const [record] = await this.creditTransactionModel.create(
      [
        {
          userId: dto.userId,
          amount: dto.amount,
          type: dto.type,
          balanceAfter: dto.balanceAfter,
          readingId: dto.readingId,
          referralId: dto.referralId,
          note: dto.note,
        },
      ],
      { session }
    );

    return record;
  }

  /**
   * Atomically credit user balance and record append-only ledger transaction.
   * Playbook §2.2: Balance never goes negative and always equals the ledger sum.
   */
  async credit(
    userId: Types.ObjectId,
    amount: number,
    reason: CreditTransactionType | string,
    options?: CreditDebitOptions
  ): Promise<{ balance: number; transaction: CreditTransactionDocument }> {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException("Credit amount must be a positive integer.");
    }

    const updatedUser = await this.userModel.findOneAndUpdate(
      { _id: userId, deletedAt: null },
      { $inc: { creditBalance: amount } },
      { new: true, session: options?.session }
    );

    if (!updatedUser) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Người dùng không tồn tại.",
      });
    }

    const [record] = await this.creditTransactionModel.create(
      [
        {
          userId,
          amount,
          type: reason as CreditTransactionType,
          balanceAfter: updatedUser.creditBalance,
          readingId: options?.readingId,
          referralId: options?.referralId,
          note: options?.note,
        },
      ],
      options?.session ? { session: options.session } : {}
    );

    return {
      balance: updatedUser.creditBalance,
      transaction: record,
    };
  }

  /**
   * Atomically debit user balance and record append-only ledger transaction.
   * Playbook §2.2: Debit requires balance >= amount. Balance never goes negative.
   */
  async debit(
    userId: Types.ObjectId,
    amount: number,
    reason: CreditTransactionType | string,
    options?: CreditDebitOptions
  ): Promise<{ balance: number; transaction: CreditTransactionDocument }> {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException("Debit amount must be a positive integer.");
    }

    const updatedUser = await this.userModel.findOneAndUpdate(
      {
        _id: userId,
        deletedAt: null,
        creditBalance: { $gte: amount },
      },
      { $inc: { creditBalance: -amount } },
      { new: true, session: options?.session }
    );

    if (!updatedUser) {
      const existingUser = await this.userModel
        .findOne({ _id: userId, deletedAt: null })
        .session(options?.session || null)
        .lean();

      if (!existingUser) {
        throw new NotFoundException({
          code: "USER_NOT_FOUND",
          message: "Người dùng không tồn tại.",
        });
      }

      throw new HttpException(
        {
          code: "INSUFFICIENT_CREDITS",
          message: "Bạn không đủ currency để thực hiện thao tác này.",
          details: {
            required: amount,
            balance: existingUser.creditBalance ?? 0,
          },
        },
        HttpStatus.PAYMENT_REQUIRED
      );
    }

    const [record] = await this.creditTransactionModel.create(
      [
        {
          userId,
          amount: -amount,
          type: reason as CreditTransactionType,
          balanceAfter: updatedUser.creditBalance,
          readingId: options?.readingId,
          referralId: options?.referralId,
          note: options?.note,
        },
      ],
      options?.session ? { session: options.session } : {}
    );

    return {
      balance: updatedUser.creditBalance,
      transaction: record,
    };
  }

  /**
   * Atomically refund debited currency back to user balance.
   */
  async refund(
    userId: Types.ObjectId,
    amount: number,
    reason: CreditTransactionType | string = CreditTransactionType.REFUND,
    options?: CreditDebitOptions
  ): Promise<{ balance: number; transaction: CreditTransactionDocument }> {
    return this.credit(userId, amount, reason, options);
  }

  /**
   * Legacy method for signup bonus.
   */
  async grantSignupBonus(
    userId: Types.ObjectId,
    session: ClientSession
  ): Promise<CreditTransactionDocument> {
    const { transaction } = await this.credit(
      userId,
      CREDIT_AMOUNTS.SIGNUP_BONUS,
      CreditTransactionType.SIGNUP_BONUS,
      { session }
    );
    return transaction;
  }

  /**
   * Legacy method for reading spend.
   */
  async spendForReading(
    userId: Types.ObjectId,
    readingId: Types.ObjectId,
    session: ClientSession
  ): Promise<CreditTransactionDocument> {
    const { transaction } = await this.debit(
      userId,
      CREDIT_AMOUNTS.READING_COST,
      CreditTransactionType.READING_SPEND,
      { readingId, session }
    );
    return transaction;
  }

  /**
   * Legacy method for reading refund.
   */
  async refundReading(
    userId: Types.ObjectId,
    readingId: Types.ObjectId,
    session: ClientSession
  ): Promise<CreditTransactionDocument> {
    const { transaction } = await this.refund(
      userId,
      CREDIT_AMOUNTS.READING_COST,
      CreditTransactionType.READING_REFUND,
      { readingId, session }
    );
    return transaction;
  }

  /**
   * Starter grant (§7.1, §10):
   * One-time per account AND per physical device. Max 5 grants per network per day.
   */
  async claimStarterGrant(
    userId: Types.ObjectId,
    options?: StarterGrantOptions
  ): Promise<StarterGrantResult> {
    const user = await this.userModel
      .findOne({ _id: userId, deletedAt: null })
      .session(options?.session || null);

    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Người dùng không tồn tại.",
      });
    }

    if (user.starterGrantedAt) {
      return { granted: false, amount: 0, reason: "ALREADY_GRANTED_TO_USER" };
    }

    if (user.referralBlocked) {
      return { granted: false, amount: 0, reason: "BLOCKED_IDENTITY" };
    }

    let ipHash: string | undefined;
    if (options?.ip) {
      const secret = this.configService.get<string>(
        "IDENTITY_HASH_SECRET",
        "palmsight-identity-secret"
      );
      ipHash = crypto
        .createHmac("sha256", secret)
        .update(options.ip.trim())
        .digest("hex");

      // Check network rate limit: <= 5 grants per network per reward day
      const today = getRewardDay();
      const count = await this.deviceModel.countDocuments({
        ipHash,
        starterGranted: true,
        starterGrantedAt: {
          $gte: new Date(today + "T00:00:00+07:00"),
        },
      });

      if (count >= 5) {
        return {
          granted: false,
          amount: 0,
          reason: "NETWORK_DAILY_LIMIT_EXCEEDED",
        };
      }
    }

    const now = new Date();
    let deviceClaimed = false;

    // 1. Atomic claim on device if deviceId provided
    if (options?.deviceId) {
      try {
        const existingDevice = await this.deviceModel
          .findOne({ deviceId: options.deviceId })
          .session(options?.session || null);

        if (existingDevice && existingDevice.starterGranted) {
          return {
            granted: false,
            amount: 0,
            reason: "DEVICE_ALREADY_CLAIMED",
          };
        }

        const deviceClaim = await this.deviceModel.findOneAndUpdate(
          { deviceId: options.deviceId, starterGranted: { $ne: true } },
          {
            $set: {
              starterGranted: true,
              starterUserId: userId,
              starterGrantedAt: now,
              ipHash,
            },
          },
          { upsert: true, new: true, session: options?.session }
        );

        if (!deviceClaim || !deviceClaim.starterGranted) {
          return {
            granted: false,
            amount: 0,
            reason: "DEVICE_ALREADY_CLAIMED",
          };
        }
        deviceClaimed = true;
      } catch (err: any) {
        if (err.code === 11000) {
          return {
            granted: false,
            amount: 0,
            reason: "DEVICE_ALREADY_CLAIMED",
          };
        }
        throw err;
      }
    }

    // 2. Atomic claim on user
    const claimedUser = await this.userModel.findOneAndUpdate(
      {
        _id: userId,
        deletedAt: null,
        starterGrantedAt: null,
        referralBlocked: false,
      },
      { $set: { starterGrantedAt: now } },
      { new: true, session: options?.session }
    );

    if (!claimedUser) {
      if (deviceClaimed && options?.deviceId) {
        await this.deviceModel.updateOne(
          { deviceId: options.deviceId, starterUserId: userId },
          {
            $set: {
              starterGranted: false,
              starterUserId: null,
              starterGrantedAt: null,
            },
          },
          { session: options?.session }
        );
      }
      return { granted: false, amount: 0, reason: "ALREADY_GRANTED_TO_USER" };
    }

    const starterAmount = Number(
      this.configService.get<number>(
        "STARTER_GRANT",
        MONETIZATION_CONFIG.STARTER_GRANT
      )
    );

    // 3. Perform credit
    try {
      await this.credit(userId, starterAmount, CreditTransactionType.STARTER, {
        note: "Starter Grant",
        session: options?.session,
      });
    } catch (err) {
      await this.userModel.updateOne(
        { _id: userId },
        { $set: { starterGrantedAt: null } },
        { session: options?.session }
      );
      if (deviceClaimed && options?.deviceId) {
        await this.deviceModel.updateOne(
          { deviceId: options.deviceId, starterUserId: userId },
          {
            $set: {
              starterGranted: false,
              starterUserId: null,
              starterGrantedAt: null,
            },
          },
          { session: options?.session }
        );
      }
      throw err;
    }

    return { granted: true, amount: starterAmount };
  }

  /**
   * Reconcile balance against the ledger sum (§12: Balance always equals ledger sum).
   */
  async reconcileBalance(
    userId: Types.ObjectId
  ): Promise<{ balance: number; ledgerSum: number; matches: boolean }> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Người dùng không tồn tại.",
      });
    }

    const [agg] = await this.creditTransactionModel.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const ledgerSum = agg?.total ?? 0;
    const balance = user.creditBalance ?? 0;

    return {
      balance,
      ledgerSum,
      matches: balance === ledgerSum,
    };
  }

  async getTransactions(
    userId: Types.ObjectId,
    query?: PaginationQueryDto
  ): Promise<CreditTransactionListResponseDto> {
    const filter: FilterQuery<CreditTransactionDocument> = { userId };

    if (query?.cursor) {
      if (!Types.ObjectId.isValid(query.cursor)) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "Cursor phân trang không hợp lệ.",
          details: {
            fields: [
              { field: "cursor", message: "Cursor phải là ObjectId hợp lệ" },
            ],
          },
        });
      }
      filter._id = { $lt: new Types.ObjectId(query.cursor) };
    }

    const limit = Math.min(Math.max(Number(query?.limit) || 20, 1), 50);

    const docs = await this.creditTransactionModel
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean()
      .exec();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore ? items[items.length - 1]._id.toString() : null;

    return {
      items: items.map((doc) => ({
        id: doc._id.toString(),
        type: doc.type,
        amount: doc.amount,
        balanceAfter: doc.balanceAfter,
        readingId: doc.readingId ? doc.readingId.toString() : undefined,
        referralId: doc.referralId ? doc.referralId.toString() : undefined,
        note: doc.note,
        createdAt: doc.createdAt.toISOString(),
      })),
      nextCursor,
    };
  }
}
