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
} from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import authService from '../services/authService';
import { showError } from '../helpers/toast';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onGoLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  onGoLogin,
}) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      showError('Vui lòng nhập email hợp lệ.', 'Thông báo');
      return;
    }

    setSubmitting(true);
    try {
      await authService.postForgotPassword({ email: email.trim().toLowerCase() });
      setSentSuccess(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Không thể gửi link lúc này. Vui lòng thử lại sau.';
      showError(msg, 'Quên mật khẩu');
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
                <Text style={styles.badgeTop}>✦ KHÔI PHỤC TÀI KHOẢN</Text>
                <Text style={styles.title}>Quên mật khẩu</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {sentSuccess ? (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>✓ Đã gửi hướng dẫn</Text>
                <Text style={styles.successDesc}>
                  Chúng tôi đã gửi liên kết đặt lại mật khẩu tới{' '}
                  <Text style={styles.boldText}>{email}</Text>. Vui lòng kiểm tra
                  hòm thư (kể cả thư mục Spam) và làm theo hướng dẫn.
                </Text>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={() => {
                    setSentSuccess(false);
                    onClose();
                    onGoLogin();
                  }}
                >
                  <Text style={styles.submitBtnText}>QUAY LẠI ĐĂNG NHẬP</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.subtitle}>
                  Nhập địa chỉ email đăng ký để nhận liên kết khôi phục mật khẩu.
                </Text>

                <Text style={styles.label}>Email tài khoản</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>GỬI LIÊN KẾT ĐẶT LẠI</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>Nhớ lại mật khẩu? </Text>
                  <TouchableOpacity onPress={onGoLogin}>
                    <Text style={styles.loginLink}>Đăng nhập</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
    fontSize: 24,
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
  },
  submitBtnText: {
    color: '#120a21',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  successBox: {
    paddingVertical: 12,
  },
  successTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.success,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 13,
  },
  loginLink: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '700',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordModal;
