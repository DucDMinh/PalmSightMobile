import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { CACHED_KEYS } from '../consts/cachedKeys';
import { getApiBaseUrl } from '../consts/apiUrl';

interface AuthHandlers {
  onSessionExpired?: () => void;
  onTokenRefreshed?: (token: string) => void;
}

class HttpService {
  public axios: AxiosInstance;
  private inMemoryToken: string | null = null;
  private handlers: AuthHandlers = {};

  constructor() {
    this.axios = axios.create({
      timeout: 30000,
    });

    // Request interceptor
    this.axios.interceptors.request.use(async (config) => {
      // Ensure baseURL is current
      if (!config.baseURL && !config.url?.startsWith('http')) {
        config.baseURL = getApiBaseUrl();
      }

      // Add bearer token
      const token = this.inMemoryToken || (await this.getToken());
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Skip ngrok warning if applicable
      if (config.headers) {
        config.headers['ngrok-skip-browser-warning'] = 'true';
      }

      return config;
    });

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const status = error.response?.status;
        const url = error.config?.url || '';

        // Only handle 401 for non-auth endpoints
        if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
          this.handlers.onSessionExpired?.();
        }

        return Promise.reject(error);
      }
    );
  }

  setAuthHandlers(handlers: AuthHandlers) {
    this.handlers = handlers;
  }

  setInMemoryToken(token: string | null) {
    this.inMemoryToken = token;
  }

  async saveToken(token: string): Promise<void> {
    this.inMemoryToken = token;
    try {
      await SecureStore.setItemAsync(CACHED_KEYS.TOKEN, token);
    } catch {}
  }

  async getToken(): Promise<string | null> {
    if (this.inMemoryToken) return this.inMemoryToken;
    try {
      const stored = await SecureStore.getItemAsync(CACHED_KEYS.TOKEN);
      if (stored) {
        this.inMemoryToken = stored;
      }
      return stored;
    } catch {
      return null;
    }
  }

  async clearToken(): Promise<void> {
    this.inMemoryToken = null;
    try {
      await SecureStore.deleteItemAsync(CACHED_KEYS.TOKEN);
    } catch {}
  }

  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.axios.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axios.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axios.put<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.axios.delete<T>(url, config);
  }
}

export const httpService = new HttpService();
export default httpService;
