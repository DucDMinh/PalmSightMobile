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
                placeholderTextColor="#9e8cb8"
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
                placeholderTextColor="#9e8cb8"
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
                  <ActivityIndicator size="small" color="#0b0716" />
                ) : (
                  <Text style={styles.submitBtnText}>Đăng nhập</Text>
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
    backgroundColor: '#1b1233',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badgeTop: {
    fontSize: 10,
    color: '#d4af37',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '800',
    color: '#f7e7b4',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#9e8cb8',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: '#d8cbe8',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f7e7b4',
    marginBottom: 6,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  forgotLink: {
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(11, 7, 22, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f7e7b4',
    fontSize: 14,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#d4af37',
    borderWidth: 1,
    borderColor: 'rgba(255, 243, 209, 0.65)',
    borderRadius: 9999,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 16,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    color: '#0b0716',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#9e8cb8',
    fontSize: 13,
  },
  registerLink: {
    color: '#f7e7b4',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default LoginModal;
