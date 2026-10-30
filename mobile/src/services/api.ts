import httpService from './httpService';
import authService from './authService';
import readingsService from './readingsService';
import accountService from './accountService';
import {
  initApiBaseUrl,
  setApiBaseUrl,
  getApiBaseUrl,
  normalizeApiUrl,
} from '../consts/apiUrl';
import { getFingerprint } from '../helpers/fingerprint';
import { uuidV4 } from '../helpers/common';
import type { ReadingSchool, HandOrientation } from '@palmsight/shared';

export {
  httpService,
  authService,
  readingsService,
  accountService,
  initApiBaseUrl,
  setApiBaseUrl,
  getApiBaseUrl,
  normalizeApiUrl,
  getFingerprint,
  uuidV4,
};

// Aliases for backward compatibility
export const initApiUrl = initApiBaseUrl;
export const setApiUrl = setApiBaseUrl;
export const getApiUrl = getApiBaseUrl;
export const getToken = () => httpService.getToken();
export const saveToken = (token: string) => httpService.saveToken(token);
export const clearToken = () => httpService.clearToken();

export interface ReadingSubmitParams {
  imageUri: string;
  school: ReadingSchool;
  topics: string[];
  hand: HandOrientation;
  aiConsent?: boolean;
}

export async function submitReadingApi(
  params: ReadingSubmitParams & { token?: string | null }
) {
  if (params.token) {
    httpService.setInMemoryToken(params.token);
  }
  return readingsService.createReading({
    imageUri: params.imageUri,
    school: params.school,
    topics: params.topics,
    hand: params.hand,
    aiConsent: params.aiConsent ?? true,
  });
}

export async function submitGuestReadingApi(params: ReadingSubmitParams) {
  return readingsService.createGuestReading({
    imageUri: params.imageUri,
    school: params.school,
    topics: params.topics,
    hand: params.hand,
    aiConsent: params.aiConsent ?? true,
  });
}

export async function getReadingsListApi(token: string, cursor?: string | null) {
  if (token) httpService.setInMemoryToken(token);
  return readingsService.getReadings(cursor);
}

export async function getReadingDetailApi(id: string, token: string) {
  if (token) httpService.setInMemoryToken(token);
  return readingsService.getReadingById(id);
}

export async function deleteReadingApi(id: string, token: string) {
  if (token) httpService.setInMemoryToken(token);
  return readingsService.deleteReading(id);
}

export async function loginApi(login: string, password: string) {
  return authService.postLogin({ login, password });
}

export async function registerApi(payload: {
  displayName: string;
  username: string;
  email: string;
  password: string;
  referralCode?: string;
  claimToken?: string;
}) {
  return authService.postRegister(payload);
}

export async function forgotPasswordApi(email: string) {
  return authService.postForgotPassword({ email });
}

export async function resetPasswordApi(token: string, newPassword: string) {
  return authService.postResetPassword({ token, newPassword });
}

export async function getProfileApi(token?: string) {
  if (token) httpService.setInMemoryToken(token);
  return accountService.getMe();
}

export function describeApiError(err: any, fallback = 'Đã có lỗi xảy ra.'): string {
  if (err?.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.message) {
    return err.message;
  }
  return fallback;
}
