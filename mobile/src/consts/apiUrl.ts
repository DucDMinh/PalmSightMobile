import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const SERVER_URL_STORAGE_KEY = 'palmsight_server_url';
export const PROD_API_BASE_URL = 'https://palmsightmobile-1.onrender.com/api/v1';

export function normalizeApiUrl(url: string): string {
  let normalized = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized}`;
  }
  if (!/\/api\/v1$/i.test(normalized)) {
    normalized = `${normalized}/api/v1`;
  }
  return normalized;
}

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;
export const DEFAULT_API_BASE_URL = ENV_API_URL
  ? normalizeApiUrl(ENV_API_URL)
  : PROD_API_BASE_URL;

let currentBaseUrl = DEFAULT_API_BASE_URL;

export function getApiBaseUrl(): string {
  return currentBaseUrl;
}

export async function setApiBaseUrl(url: string): Promise<string> {
  currentBaseUrl = normalizeApiUrl(url);
  try {
    await SecureStore.setItemAsync(SERVER_URL_STORAGE_KEY, currentBaseUrl);
  } catch {}
  return currentBaseUrl;
}

export async function initApiBaseUrl(): Promise<string> {
  // In release mode, strictly lock to production Render backend
  if (!__DEV__) {
    currentBaseUrl = DEFAULT_API_BASE_URL;
    return currentBaseUrl;
  }
  try {
    const saved = await SecureStore.getItemAsync(SERVER_URL_STORAGE_KEY);
    if (saved) {
      currentBaseUrl = normalizeApiUrl(saved);
      return currentBaseUrl;
    }
  } catch {}
  return currentBaseUrl;
}

// Endpoints (dynamically resolve based on currentBaseUrl)
export const getEndpoints = () => {
  const base = currentBaseUrl;
  return {
    AUTH_REGISTER_URL: `${base}/auth/register`,
    AUTH_RESEND_VERIFICATION_URL: `${base}/auth/resend-verification`,
    AUTH_VERIFY_EMAIL_URL: `${base}/auth/verify-email`,
    AUTH_LOGIN_URL: `${base}/auth/login`,
    AUTH_GOOGLE_URL: `${base}/auth/google`,
    AUTH_FACEBOOK_URL: `${base}/auth/facebook`,
    AUTH_FORGOT_PASSWORD_URL: `${base}/auth/forgot-password`,
    AUTH_RESET_PASSWORD_URL: `${base}/auth/reset-password`,
    AUTH_REFRESH_URL: `${base}/auth/refresh`,
    AUTH_LOGOUT_URL: `${base}/auth/logout`,
    ME_PASSWORD_URL: `${base}/me/password`,
    ME_REFERRAL_URL: `${base}/me/referral`,
    ME_URL: `${base}/me`,
    ME_REFERRALS_URL: `${base}/me/referrals`,
    ME_CREDIT_TRANSACTIONS_URL: `${base}/me/credit-transactions`,
    READINGS_URL: `${base}/readings`,
    READINGS_GUEST_URL: `${base}/readings/guest`,
  };
};
