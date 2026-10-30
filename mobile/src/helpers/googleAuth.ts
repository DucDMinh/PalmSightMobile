import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  APP_PACKAGE_NAME,
  APP_SCHEME,
} from '../consts/common';
import { uuidV4 } from './common';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthResult {
  idToken?: string;
  code?: string;
  cancelled?: boolean;
  error?: string;
  configNeeded?: boolean;
  platform?: 'android' | 'ios' | 'web';
  packageName?: string;
}

/**
 * Returns the client ID and configuration status for the current platform.
 */
export function getGoogleConfigStatus(): {
  clientId: string;
  isPlatformConfigured: boolean;
  platform: 'android' | 'ios' | 'web';
  packageName: string;
} {
  if (Platform.OS === 'android') {
    return {
      clientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
      isPlatformConfigured: Boolean(GOOGLE_ANDROID_CLIENT_ID),
      platform: 'android',
      packageName: APP_PACKAGE_NAME,
    };
  }
  if (Platform.OS === 'ios') {
    return {
      clientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
      isPlatformConfigured: Boolean(GOOGLE_IOS_CLIENT_ID),
      platform: 'ios',
      packageName: APP_PACKAGE_NAME,
    };
  }
  return {
    clientId: GOOGLE_WEB_CLIENT_ID,
    isPlatformConfigured: Boolean(GOOGLE_WEB_CLIENT_ID),
    platform: 'web',
    packageName: APP_PACKAGE_NAME,
  };
}

/**
 * Generates the Google-compliant redirect URI according to Google OAuth 2.0 policy.
 * - iOS: Google strictly enforces the reversed client ID scheme
 *   e.g. com.googleusercontent.apps.1001438141254-j0n1titmkvoqg0d7fbp7qcji3hdj8hv6:/oauthredirect
 * - Android: uses <package_name>:/oauthredirect
 * - Web: uses makeRedirectUri
 */
export function getGoogleRedirectUri(
  platform: 'android' | 'ios' | 'web',
  clientId: string
): string {
  if (platform === 'ios') {
    const prefix = clientId.replace('.apps.googleusercontent.com', '').trim();
    return `com.googleusercontent.apps.${prefix}:/oauthredirect`;
  }
  if (platform === 'android') {
    return `${APP_PACKAGE_NAME}:/oauthredirect`;
  }
  return AuthSession.makeRedirectUri({
    scheme: APP_SCHEME,
    path: 'oauth/google',
  });
}

/**
 * Generates PKCE codeVerifier and codeChallenge (RFC 7636) for secure mobile OAuth.
 */
async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomBytes = await Crypto.getRandomBytesAsync(64);
  let codeVerifier = '';
  for (let i = 0; i < randomBytes.length; i++) {
    codeVerifier += charset[randomBytes[i] % charset.length];
  }

  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );

  const codeChallenge = digest
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { codeVerifier, codeChallenge };
}

/**
 * Initiates Google OAuth login via ASWebAuthenticationSession / Chrome Custom Tabs with PKCE.
 * 1. Generates PKCE code_challenge and starts authorization with response_type=code.
 * 2. Intercepts authorization code on redirect.
 * 3. Exchanges code for ID Token at https://oauth2.googleapis.com/token without requiring client_secret.
 * 4. Returns verified idToken to be verified by backend.
 */
export async function promptGoogleSignIn(): Promise<GoogleAuthResult> {
  const { clientId, isPlatformConfigured, platform, packageName } =
    getGoogleConfigStatus();

  // If on Android or iOS and the platform client ID hasn't been configured,
  // notify early to avoid Google's opaque "Lỗi ủy quyền: invalid_request" page.
  if (Platform.OS !== 'web' && !isPlatformConfigured) {
    return {
      configNeeded: true,
      platform,
      packageName,
      error:
        `Chưa cấu hình Google ${platform === 'android' ? 'Android' : 'iOS'} Client ID. ` +
        `Google không cho phép Web Client ID chạy trên ứng dụng di động với custom scheme.`,
    };
  }

  try {
    const redirectUri = getGoogleRedirectUri(platform, clientId);
    const { codeVerifier, codeChallenge } = await generatePKCE();
    const state = uuidV4();

    // Standard OAuth 2.0 PKCE Authorization URL for native iOS & Android (RFC 7636)
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&code_challenge=${encodeURIComponent(codeChallenge)}` +
      `&code_challenge_method=S256` +
      `&state=${encodeURIComponent(state)}` +
      `&prompt=select_account`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
      const url = result.url;
      const queryPart = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
      const hashPart = url.includes('#') ? url.split('#')[1] : '';
      const searchParams = new URLSearchParams(queryPart || hashPart);

      const code = searchParams.get('code');
      const err = searchParams.get('error');

      if (err) {
        return { error: `Google OAuth báo lỗi: ${err}` };
      }

      if (!code) {
        return { error: 'Không nhận được mã xác thực (code) từ Google.' };
      }

      // Exchange code for tokens via Google's token endpoint using PKCE
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }).toString(),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.id_token) {
        const errorMsg =
          tokenData.error_description ||
          tokenData.error ||
          'Không thể đổi mã xác thực lấy Google ID Token.';
        return { error: errorMsg };
      }

      return { idToken: tokenData.id_token };
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { cancelled: true };
    }

    return { error: 'Đăng nhập Google không thành công.' };
  } catch (err: any) {
    return { error: err?.message || 'Có lỗi khi mở đăng nhập Google.' };
  }
}
