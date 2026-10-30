import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { promptGoogleSignIn } from '../helpers/googleAuth';
import authService from '../services/authService';
import { useAuth } from '../providers/AuthenticationProvider';
import { showError, showSuccess } from '../helpers/toast';
import GoogleConfigModal from './GoogleConfigModal';
import type { AuthResponseDto } from '@palmsight/shared';

interface GoogleLoginButtonProps {
  claimToken?: string | null;
  onSuccess?: (authData: AuthResponseDto) => void;
  title?: string;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  claimToken,
  onSuccess,
  title = 'Tiếp tục với Google',
}) => {
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const { setAuthSession } = useAuth();

  const handleAuthPayload = async (idToken?: string, code?: string) => {
    const res = await authService.postGoogleLogin({
      idToken,
      code,
      claimToken: claimToken || undefined,
    });

    setAuthSession({
      accessToken: res.accessToken,
      user: res.user,
    });

    showSuccess(`Xin chào ${res.user.displayName}!`, 'Đăng nhập thành công');
    onSuccess?.(res);
  };

  const handleGooglePress = async () => {
    setLoading(true);
    try {
      const authResult = await promptGoogleSignIn();

      if (authResult.cancelled) {
        setLoading(false);
        return;
      }

      if (authResult.configNeeded) {
        setLoading(false);
        setShowConfigModal(true);
        return;
      }

      if (authResult.error) {
        showError(authResult.error, 'Đăng nhập Google');
        setLoading(false);
        return;
      }

      await handleAuthPayload(authResult.idToken, authResult.code);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Đăng nhập Google không thành công. Vui lòng thử lại.';
      showError(msg, 'Đăng nhập Google');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectAuthAnyway = async () => {
    await handleGooglePress();
  };

  const handleManualTokenSubmit = async (manualIdToken: string) => {
    await handleAuthPayload(manualIdToken, undefined);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={handleGooglePress}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#f7e7b4" />
        ) : (
          <View style={styles.contentRow}>
            {/* Custom Google 'G' Icon */}
            <View style={styles.googleIconBadge}>
              <Text style={styles.googleLetter}>G</Text>
            </View>
            <Text style={styles.buttonText}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>

      <GoogleConfigModal
        visible={showConfigModal}
        platform={Platform.OS === 'ios' ? 'ios' : 'android'}
        onClose={() => setShowConfigModal(false)}
        onTryDirectAuth={handleDirectAuthAnyway}
        onSubmitManualToken={handleManualTokenSubmit}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(27, 18, 51, 0.85)',
    borderColor: 'rgba(212, 175, 55, 0.45)',
    borderWidth: 1,
    borderRadius: 9999,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleLetter: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4285F4',
  },
  buttonText: {
    color: '#f5e6c8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default GoogleLoginButton;
