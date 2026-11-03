import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  MONETIZATION_CONFIG,
  AppEconomyConfigDto,
} from "@palmsight/shared";

@Controller("config")
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfig(): AppEconomyConfigDto {
    const currency = this.configService.get<string>(
      "CURRENCY",
      MONETIZATION_CONFIG.CURRENCY
    );
    const pricePerAction = Number(
      this.configService.get<number>(
        "PRICE_PER_ACTION",
        MONETIZATION_CONFIG.PRICE_PER_ACTION
      )
    );
    const maxActionsPerTap = Number(
      this.configService.get<number>(
        "MAX_ACTIONS_PER_TAP",
        MONETIZATION_CONFIG.MAX_ACTIONS_PER_TAP
      )
    );
    const starterGrant = Number(
      this.configService.get<number>(
        "STARTER_GRANT",
        MONETIZATION_CONFIG.STARTER_GRANT
      )
    );
    const vipDaily = Number(
      this.configService.get<number>(
        "VIP_DAILY",
        MONETIZATION_CONFIG.VIP_DAILY
      )
    );

    return {
      currency,
      pricePerAction,
      maxActionsPerTap,
      starterGrant,
      vipDaily,
      earnLadder: [...MONETIZATION_CONFIG.CHECKIN_LADDER],
      streakLength: MONETIZATION_CONFIG.STREAK_LENGTH,
      milestones: [...MONETIZATION_CONFIG.MILESTONES],
      restoreCostPerDay: MONETIZATION_CONFIG.RESTORE_COST_PER_DAY,
      restoreMaxMissed: MONETIZATION_CONFIG.RESTORE_MAX_MISSED,
      wheelPrizes: [...MONETIZATION_CONFIG.WHEEL_PRIZES],
      freeSpins: MONETIZATION_CONFIG.FREE_SPINS,
      adSpins: MONETIZATION_CONFIG.AD_SPINS,
      currencySpinCost: MONETIZATION_CONFIG.CURRENCY_SPIN_COST,
      checkinDoubleCap: MONETIZATION_CONFIG.CHECKIN_DOUBLE_CAP,
      bonusAdAmount: MONETIZATION_CONFIG.BONUS_AD_AMOUNT,
      bonusAdCap: MONETIZATION_CONFIG.BONUS_AD_CAP,
      minAdWatchSeconds: MONETIZATION_CONFIG.MIN_AD_WATCH_SECONDS,
      interstitialGap: MONETIZATION_CONFIG.INTERSTITIAL_GAP,
      adsUserGap: MONETIZATION_CONFIG.ADS_USER_GAP,
      adsUserDeclines: MONETIZATION_CONFIG.ADS_USER_DECLINES,
      paywallReturnAfter: MONETIZATION_CONFIG.PAYWALL_RETURN_AFTER,
      paywallCloseDelay: MONETIZATION_CONFIG.PAYWALL_CLOSE_DELAY,
      noAdWait: MONETIZATION_CONFIG.NO_AD_WAIT,
      vipOnlyFeature: MONETIZATION_CONFIG.VIP_ONLY_FEATURE,
      languages: [...MONETIZATION_CONFIG.LANGUAGES],
      legal: {
        privacyUrl: this.configService.get<string>(
          "PRIVACY_URL",
          MONETIZATION_CONFIG.LEGAL.privacyUrl
        ),
        termsUrl: this.configService.get<string>(
          "TERMS_URL",
          MONETIZATION_CONFIG.LEGAL.termsUrl
        ),
      },
    };
  }
}
