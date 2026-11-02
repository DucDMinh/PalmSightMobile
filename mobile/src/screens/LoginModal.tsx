import React, { useState } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import SocialLoginButtons from '../components/SocialLoginButtons';
import { useAuth } from '../providers/AuthenticationProvider';
import { showError, showSuccess } from '../helpers/toast';
import { MysticButton } from '../components/MysticButton';

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
  const { login } = useAuth();
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
            {/* Grab Handle */}
            <View style={styles.grabHandle} />

            <View style={styles.headerRow}>
              <View>
                <Text style={styles.badgeTop}>✦ CỔNG HUYỀN MÔN ✦</Text>
                <Text style={styles.title}>Đăng Nhập</Text>
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
                Sử dụng email hoặc tên người dùng của bạn để tiếp tục.
              </Text>

              {/* Identifier Input */}
              <Text style={styles.label}>Email hoặc Tên người dùng</Text>
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="email@example.com hoặc username"
                placeholderTextColor="#7e6d99"
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
                placeholderTextColor="#7e6d99"
                secureTextEntry
              />

              {/* Submit Button */}
              <MysticButton
                title="Đăng Nhập"
                variant="primary"
                size="lg"
                onPress={handleSubmit}
                loading={submitting}
                fullWidth
                style={styles.submitBtn}
              />

              {/* Social Login with Google */}
              <SocialLoginButtons onSuccess={() => onClose()} />

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
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.35)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeTop: {
    fontSize: 10,
    color: '#d4af37',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  closeBtnText: {
    color: '#9e8cb8',
    fontSize: 14,
  },
  subtitle: {
    fontSize: 13,
    color: '#9e8cb8',
    marginBottom: 18,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#f5e6c8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f5e6c8',
    fontSize: 14,
    marginBottom: 14,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotLink: {
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#9e8cb8',
  },
  registerLink: {
    fontSize: 13,
    color: '#d4af37',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default LoginModal;
