export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '1001438141254-c7mc6t2sreqj0ho8kdkfanvui5sn0b0h.apps.googleusercontent.com';

export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

// Fallback default client id (Web)
export const GOOGLE_CLIENT_ID = GOOGLE_WEB_CLIENT_ID;

export const APP_PACKAGE_NAME = 'com.palmsight.app';
export const APP_SCHEME = 'palmsight';
export const DEFAULT_PAGE_LIMIT = 20;
