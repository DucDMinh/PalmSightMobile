export interface MilestoneConfigDto {
  day: number;
  bonus: number;
}

export interface LegalUrlsDto {
  privacyUrl: string;
  termsUrl: string;
}

export interface AppEconomyConfigDto {
  currency: string;
  pricePerAction: number;
  maxActionsPerTap: number;
  starterGrant: number;
  vipDaily: number;
  earnLadder: number[];
  streakLength: number;
  milestones: MilestoneConfigDto[];
  restoreCostPerDay: number;
  restoreMaxMissed: number;
  wheelPrizes: number[];
  freeSpins: number;
  adSpins: number;
  currencySpinCost: number;
  checkinDoubleCap: number;
  bonusAdAmount: number;
  bonusAdCap: number;
  minAdWatchSeconds: number;
  interstitialGap: number;
  adsUserGap: number;
  adsUserDeclines: number;
  paywallReturnAfter: number;
  paywallCloseDelay: number;
  noAdWait: number;
  vipOnlyFeature?: string;
  languages: string[];
  legal: LegalUrlsDto;
}

export type AdRewardKind = "checkin" | "spin" | "bonus";
export type AdRewardStatus = "pending" | "rewarded" | "capped" | "released";

export interface EarnStatusResponseDto {
  checkedInToday: boolean;
  currentStreak: number;
  todayReward: number;
  nextMilestone: MilestoneConfigDto | null;
  canRestore: boolean;
  missedDays: number;
  restoreCost: number;
  doubleCheckedInToday: boolean;
  doubleCheckinAvailable: boolean;
  freeSpinsRemaining: number;
  adSpinsRemaining: number;
  currencySpinCost: number;
  prizes: number[];
  bonusAdsRemaining: number;
  bonusAdAmount: number;
  rewardDay: string;
  secondsUntilNextDay: number;
  balance: number;
}

export interface CheckinResponseDto {
  amount: number;
  streakDays: number;
  milestoneBonus: number;
  totalReward: number;
  balance: number;
  checkinDay: string;
}

export interface CheckinRestoreResponseDto {
  restored: boolean;
  cost: number;
  streakDays: number;
  rewardAmount: number;
  milestoneBonus: number;
  balance: number;
}

export interface SpinResponseDto {
  prizeIndex: number;
  amount: number;
  balance: number;
}

export interface CreateAdRewardTicketDto {
  kind: AdRewardKind;
  deviceId?: string;
}

export interface AdRewardTicketResponseDto {
  id: string;
  kind: AdRewardKind;
  amount: number;
  prizeIndex?: number;
  minWatchSeconds: number;
  status: AdRewardStatus;
  createdAt: string;
}

export interface ClaimAdRewardResponseDto {
  status: "rewarded" | "capped";
  amount?: number;
  prizeIndex?: number;
  balance?: number;
}
