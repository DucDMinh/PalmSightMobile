export const BaseUrl = {
  Homepage: 'home',
  Scan: 'scan',
  Readings: 'history',
  ReadingDetail: 'reading-detail',
  Wallet: 'wallet',
  Account: 'account',
  Referral: 'referral',
  ReferralEnter: 'referral-enter',
  Login: 'login',
  Register: 'register',
  ForgotPassword: 'forgot-password',
  ResetPassword: 'reset-password',
  VerifyEmail: 'verify-email',
  CheckEmail: 'check-email',
  ChangePassword: 'change-password',
  GuestReadingPreview: 'guest-preview',
} as const;

export type RouteKey = typeof BaseUrl[keyof typeof BaseUrl];

export default BaseUrl;
