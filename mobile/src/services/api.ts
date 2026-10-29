import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ReadingSchool, HandOrientation } from '@palmsight/shared';

export const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:4000/api/v1',
  ios: 'http://localhost:4000/api/v1',
  default: 'http://localhost:4000/api/v1',
});

let currentApiUrl = DEFAULT_API_URL;

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

const SERVER_URL_KEY = 'palmsight_server_url';

export async function initApiUrl(): Promise<string> {
  try {
    const saved = await SecureStore.getItemAsync(SERVER_URL_KEY);
    if (saved) {
      currentApiUrl = normalizeApiUrl(saved);
      return currentApiUrl;
    }
  } catch {}
  return currentApiUrl;
}

export const setApiUrl = async (url: string) => {
  currentApiUrl = normalizeApiUrl(url);
  try {
    await SecureStore.setItemAsync(SERVER_URL_KEY, currentApiUrl);
  } catch {}
};

// Skip ngrok's HTML interstitial page so API calls receive JSON
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

// Log network calls directly to Expo terminal
axios.interceptors.request.use((config) => {
  console.log(`🌐 [HTTP REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

axios.interceptors.response.use(
  (response) => {
    console.log(`✅ [HTTP RESPONSE ${response.status}] ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status || 'NO_RESPONSE';
    const url = error.config?.url || 'unknown';
    console.warn(`❌ [HTTP ERROR ${status}] ${url}`);
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === 'string' && (data.includes('<!DOCTYPE') || data.includes('<html'))) {
        const noscriptMatch = data.match(/<noscript>(.*?)<\/noscript>/i);
        const titleMatch = data.match(/<title>(.*?)<\/title>/i);
        const reason = noscriptMatch?.[1] || titleMatch?.[1] || 'Máy chủ/Proxy trả về trang HTML thay vì JSON.';
        console.warn(`   ⚠️ Lỗi từ Gateway/Tunnel: ${reason}`);
      } else {
        console.warn('   Chi tiết lỗi:', typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
      }
    } else {
      console.warn('   Thông điệp lỗi:', error.message);
    }
    return Promise.reject(error);
  }
);

export const getApiUrl = () => currentApiUrl;

const TOKEN_KEY = 'palmsight_access_token';

export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {}
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
}

export interface ReadingSubmitParams {
  imageUri: string;
  school: ReadingSchool;
  topics: string[];
  hand: HandOrientation;
}

function uuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEVICE_ID_KEY = 'palmsight_device_id';

async function getDeviceFingerprint(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (existing && existing.length >= 16) return existing;
    const created = `mobile-${uuidV4()}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
    return created;
  } catch {
    return `mobile-${uuidV4()}`;
  }
}

function buildReadingFormData(params: ReadingSubmitParams): FormData {
  const { imageUri, school, topics, hand } = params;
  const formData = new FormData();
  formData.append('school', school);
  formData.append('topics', topics.join(','));
  formData.append('hand', hand);
  formData.append('aiConsent', 'true');

  const filename = imageUri.split('/').pop() || 'palm.jpg';
  formData.append('image', {
    uri: imageUri,
    name: filename,
    type: 'image/jpeg',
  } as any);

  return formData;
}

// Readings APIs
export async function submitReadingApi(
  params: ReadingSubmitParams & { token?: string | null }
) {
  const formData = buildReadingFormData(params);

  const headers: Record<string, string> = {
    'Content-Type': 'multipart/form-data',
    'Idempotency-Key': uuidV4(),
  };
  if (params.token) {
    headers['Authorization'] = `Bearer ${params.token}`;
  }

  const response = await axios.post(`${getApiUrl()}/readings`, formData, {
    headers,
    timeout: 60000,
  });
  return response.data;
}

export async function submitGuestReadingApi(params: ReadingSubmitParams) {
  const formData = buildReadingFormData(params);
  formData.append('fingerprint', await getDeviceFingerprint());

  const response = await axios.post(`${getApiUrl()}/readings/guest`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Idempotency-Key': uuidV4(),
    },
    timeout: 60000,
  });
  return response.data;
}

export async function getReadingsListApi(token: string, cursor?: string | null) {
  const params: Record<string, any> = { limit: 20 };
  if (cursor) params.cursor = cursor;
  const response = await axios.get(`${getApiUrl()}/readings`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return response.data;
}

export async function getReadingDetailApi(id: string, token: string) {
  const response = await axios.get(`${getApiUrl()}/readings/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function deleteReadingApi(id: string, token: string) {
  const response = await axios.delete(`${getApiUrl()}/readings/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// Auth APIs
export async function loginApi(login: string, password: string) {
  const response = await axios.post(`${getApiUrl()}/auth/login`, {
    login,
    password,
  });
  return response.data;
}

export async function registerApi(payload: {
  displayName: string;
  username: string;
  email: string;
  password: string;
  referralCode?: string;
}) {
  const response = await axios.post(`${getApiUrl()}/auth/register`, payload);
  return response.data;
}

export async function forgotPasswordApi(email: string) {
  const response = await axios.post(`${getApiUrl()}/auth/forgot-password`, { email });
  return response.data;
}

export async function resetPasswordApi(token: string, newPassword: string) {
  const response = await axios.post(`${getApiUrl()}/auth/reset-password`, {
    token,
    newPassword,
  });
  return response.data;
}

// User / Account APIs
export async function getProfileApi(token: string) {
  const response = await axios.get(`${getApiUrl()}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string,
  token: string
) {
  const response = await axios.put(
    `${getApiUrl()}/me/password`,
    { currentPassword, newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

// Wallet & Transactions APIs
export async function getCreditTransactionsApi(token: string, cursor?: string | null) {
  const params: Record<string, any> = { limit: 20 };
  if (cursor) params.cursor = cursor;
  const response = await axios.get(`${getApiUrl()}/me/credit-transactions`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return response.data;
}

// Referral APIs
export async function getReferralsApi(token: string, cursor?: string | null) {
  const params: Record<string, any> = { limit: 20 };
  if (cursor) params.cursor = cursor;
  const response = await axios.get(`${getApiUrl()}/me/referrals`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return response.data;
}

export async function enterReferralApi(code: string, token: string) {
  const response = await axios.post(
    `${getApiUrl()}/me/referral`,
    { code },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

// Error describer
export function describeApiError(err: any, fallback: string): string {
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return `Không thể kết nối đến máy chủ (${getApiUrl()}).\n\nHãy kiểm tra:\n1. Điện thoại và máy tính có bắt chung một mạng Wi-Fi không.\n2. Địa chỉ IP trong tab Cài đặt có đúng là IP máy tính không.`;
  }
  const apiError = err?.response?.data?.error;
  if (apiError) {
    const fields: { field: string; message: string }[] = apiError.details?.fields ?? [];
    const fieldLines = fields.map((f) => `• ${f.field}: ${f.message}`).join('\n');
    return fieldLines ? `${apiError.message}\n\n${fieldLines}` : apiError.message;
  }
  if (typeof err?.response?.data === 'string' && err.response.data.includes('ERR_NGROK')) {
    return 'Đường dẫn ngrok đang offline hoặc hết hạn. Vui lòng kiểm tra lại tiến trình ngrok trên máy tính.';
  }
  if (err?.response?.status) {
    return `Lỗi máy chủ (HTTP ${err.response.status}).`;
  }
  return err?.message || fallback;
}
