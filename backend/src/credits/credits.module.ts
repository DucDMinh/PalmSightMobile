import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  CreditTransaction,
  CreditTransactionSchema,
} from "../schemas/credit-transaction.schema";
import { User, UserSchema } from "../schemas/user.schema";
import { Device, DeviceSchema } from "../schemas/device.schema";
import { AdReward, AdRewardSchema } from "../schemas/ad-reward.schema";
import { CreditLedgerService } from "./credit-ledger.service";
import { EarnService } from "./earn.service";
import { ConfigController } from "./config.controller";
import { EarnController } from "./earn.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([
      { name: CreditTransaction.name, schema: CreditTransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: AdReward.name, schema: AdRewardSchema },
    ]),
  ],
  controllers: [ConfigController, EarnController],
  providers: [CreditLedgerService, EarnService],
  exports: [CreditLedgerService, EarnService, MongooseModule],
})
export class CreditsModule {}
