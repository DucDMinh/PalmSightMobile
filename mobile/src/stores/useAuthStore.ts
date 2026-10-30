import { useState, useEffect } from 'react';
import type { AuthUser } from '../interfaces/user';
import type { UserSummaryDto } from '@palmsight/shared';
import httpService from '../services/httpService';

export interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isLogged: boolean;
  loading: boolean;
  setAuthSession: (session: {
    accessToken: string;
    user: AuthUser | UserSummaryDto;
  }) => void;
  clearAuthSession: () => void;
  updateUser: (fields: Partial<AuthUser>) => void;
  setLoading: (loading: boolean) => void;
}

type Listener = () => void;

function createStore<T>(
  initializer: (
    set: (updater: Partial<T> | ((state: T) => Partial<T>)) => void,
    get: () => T
  ) => T
) {
  let state: T;
  const listeners = new Set<Listener>();

  const set = (updater: Partial<T> | ((s: T) => Partial<T>)) => {
    const next = typeof updater === 'function' ? updater(state) : updater;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };

  const get = () => state;
  state = initializer(set, get);

  function useStore(): T;
  function useStore<U>(selector: (state: T) => U): U;
  function useStore<U>(selector?: (state: T) => U): U | T {
    const [, setTick] = useState(0);
    useEffect(() => {
      const listener = () => setTick((t) => t + 1);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, []);
    return selector ? selector(state) : state;
  }

  useStore.getState = get;
  useStore.setState = set;
  return useStore;
}

export const useAuthStore = createStore<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isLogged: false,
  loading: true,

  setAuthSession: ({ accessToken, user }) => {
    httpService.saveToken(accessToken);
    set({
      accessToken,
      user: user as AuthUser,
      isLogged: true,
      loading: false,
    });
  },

  clearAuthSession: () => {
    httpService.clearToken();
    set({
      accessToken: null,
      user: null,
      isLogged: false,
      loading: false,
    });
  },

  updateUser: (fields) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...fields } : null,
    }));
  },

  setLoading: (loading) => set({ loading }),
}));

export default useAuthStore;
