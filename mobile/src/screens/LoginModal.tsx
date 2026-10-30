import React, { useState } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import SocialLoginButtons from '../components/SocialLoginButtons';
import { useAuth } from '../providers/AuthenticationProvider';
import { showError, showSuccess } from '../helpers/toast';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onGoRegister: () => void;
  onGoForgotPassword: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  visible,
  onClose,
  onGoRegister,
  onGoForgotPassword,
}) => {
  const { login, claimToken } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedLogin = identifier.trim();
    if (!trimmedLogin) {
      showError('Vui lòng nhập email hoặc tên đăng nhập.', 'Thông báo');
      return;
    }
    if (!password) {
      showError('Vui lòng nhập mật khẩu.', 'Thông báo');
      return;
    }

    setSubmitting(true);
    try {
      const data = await login({
        login: trimmedLogin.toLowerCase(),
        password,
      });
      showSuccess(`Chào mừng ${data.user.displayName}!`, 'Đăng nhập thành công');
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      showError(msg, 'Đăng nhập');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          <TarotCard style={styles.card}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.badgeTop}>✦ CỔNG HUYỀN MÔN</Text>
                <Text style={styles.title}>Đăng nhập</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.subtitle}>
                Dùng email hoặc tên người dùng của bạn.
              </Text>

              {/* Identifier Input */}
              <Text style={styles.label}>Email hoặc Tên người dùng</Text>
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="email@example.com hoặc username"
                placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Password Input */}
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Mật khẩu</Text>
                <TouchableOpacity onPress={onGoForgotPassword}>
                  <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
                secureTextEntry
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>[ ĐĂNG NHẬP ]</Text>
                )}
              </TouchableOpacity>

              {/* Social Login with Google */}
              <SocialLoginButtons
                claimToken={claimToken}
                onSuccess={() => onClose()}
              />

              {/* Switch to Register */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                <TouchableOpacity onPress={onGoRegister}>
                  <Text style={styles.registerLink}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TarotCard>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 10, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '90%',
    width: '100%',
  },
  card: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badgeTop: {
    fontSize: 10,
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  closeBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: PALMSIGHT_MOBILE_THEME.colors.goldDim,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    textDecorationLine: 'underline',
  },
  input: {
    height: 48,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingHorizontal: 14,
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 15,
    marginBottom: 16,
  },
  submitBtn: {
    height: 48,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#120a21',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 13,
  },
  registerLink: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '700',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

export default LoginModal;
