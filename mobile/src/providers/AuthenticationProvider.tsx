import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import useAuthStore from '../stores/useAuthStore';
import authService from '../services/authService';
import accountService from '../services/accountService';
import httpService from '../services/httpService';
import { initApiBaseUrl } from '../consts/apiUrl';
import type { AuthUser } from '../interfaces/user';
import type { UserSummaryDto, LoginRequestDto } from '@palmsight/shared';

export interface AuthenticationContextType {
  loading: boolean;
  isLogged: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  login: (credentials: LoginRequestDto) => Promise<any>;
  logout: () => Promise<void>;
  setAuthSession: (session: { accessToken: string; user: AuthUser | UserSummaryDto }) => void;
  updateUser: (fields: Partial<AuthUser>) => void;
  refreshProfile: () => Promise<void>;
  // Auth Modal Controls
  loginModalVisible: boolean;
  setLoginModalVisible: (v: boolean) => void;
  registerModalVisible: boolean;
  setRegisterModalVisible: (v: boolean) => void;
  forgotPasswordVisible: boolean;
  setForgotPasswordVisible: (v: boolean) => void;
  claimToken: string | null;
  setClaimToken: (token: string | null) => void;
}

const AuthenticationContext = createContext<AuthenticationContextType>({
  loading: true,
  isLogged: false,
  accessToken: null,
  user: null,
  login: async () => {},
  logout: async () => {},
  setAuthSession: () => {},
  updateUser: () => {},
  refreshProfile: async () => {},
  loginModalVisible: false,
  setLoginModalVisible: () => {},
  registerModalVisible: false,
  setRegisterModalVisible: () => {},
  forgotPasswordVisible: false,
  setForgotPasswordVisible: () => {},
  claimToken: null,
  setClaimToken: () => {},
});

export const useAuth = () => useContext(AuthenticationContext);

interface AuthenticationProviderProps {
  children: ReactNode;
}

export const AuthenticationProvider: React.FC<AuthenticationProviderProps> = ({
  children,
}) => {
  const store = useAuthStore();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [claimToken, setClaimToken] = useState<string | null>(null);

  // Initialize API URL, Token and Fetch Profile
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        await initApiBaseUrl();
        const savedToken = await httpService.getToken();
        if (savedToken && mounted) {
          httpService.setInMemoryToken(savedToken);
          try {
            const meRes = await accountService.getMe();
            if (mounted) {
              store.setAuthSession({ accessToken: savedToken, user: meRes });
            }
          } catch {
            // Token expired or invalid
            if (mounted) {
              store.clearAuthSession();
            }
          }
        } else if (mounted) {
          store.setLoading(false);
        }
      } catch {
        if (mounted) store.setLoading(false);
      }
    };

    httpService.setAuthHandlers({
      onSessionExpired: () => {
        if (mounted) {
          store.clearAuthSession();
        }
      },
    });

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginRequestDto) => {
      const data = await authService.postLogin(credentials);
      store.setAuthSession({
        accessToken: data.accessToken,
        user: data.user,
      });
      return data;
    },
    [store]
  );

  const logout = useCallback(async () => {
    try {
      await authService.postLogout();
    } catch {}
    store.clearAuthSession();
  }, [store]);

  const refreshProfile = useCallback(async () => {
    const token = store.accessToken || (await httpService.getToken());
    if (!token) return;
    try {
      const res = await accountService.getMe();
      store.updateUser(res);
    } catch {}
  }, [store]);

  return (
    <AuthenticationContext.Provider
      value={{
        loading: store.loading,
        isLogged: store.isLogged,
        accessToken: store.accessToken,
        user: store.user,
        login,
        logout,
        setAuthSession: store.setAuthSession,
        updateUser: store.updateUser,
        refreshProfile,
        loginModalVisible,
        setLoginModalVisible,
        registerModalVisible,
        setRegisterModalVisible,
        forgotPasswordVisible,
        setForgotPasswordVisible,
        claimToken,
        setClaimToken,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};

export default AuthenticationProvider;
