import {
  UserSummaryDto,
  UserReferralInfoDto,
  AuthProvider,
} from '@palmsight/shared';

export type AuthUser = UserSummaryDto & {
  email?: string | null;
  hasPassword?: boolean;
  providers?: AuthProvider[];
  referral?: UserReferralInfoDto;
  referralLink?: string;
  avatarUrl?: string | null;
};

export type UserDto = AuthUser;
