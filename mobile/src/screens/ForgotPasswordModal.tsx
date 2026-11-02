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
} from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import authService from '../services/authService';
import { showError } from '../helpers/toast';
import { MysticButton } from '../components/MysticButton';

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
      showError('Vui lòng nhập địa chỉ email hợp lệ.', 'Thông báo');
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
            <View style={styles.grabHandle} />

            <View style={styles.headerRow}>
              <View>
                <Text style={styles.badgeTop}>✦ KHÔI PHỤC TÀI KHOẢN ✦</Text>
                <Text style={styles.title}>Quên Mật Khẩu</Text>
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
                <Text style={styles.successTitle}>✓ Đã gửi liên kết khôi phục</Text>
                <Text style={styles.successDesc}>
                  Chúng tôi đã gửi liên kết đặt lại mật khẩu tới{' '}
                  <Text style={styles.boldText}>{email}</Text>. Vui lòng kiểm tra
                  hòm thư (kể cả thư mục Spam) và làm theo hướng dẫn.
                </Text>
                <MysticButton
                  title="Quay lại đăng nhập"
                  variant="primary"
                  size="md"
                  onPress={() => {
                    setSentSuccess(false);
                    onClose();
                    onGoLogin();
                  }}
                  fullWidth
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : (
              <View>
                <Text style={styles.subtitle}>
                  Nhập email đăng ký tài khoản của bạn để nhận liên kết khôi phục mật khẩu.
                </Text>

                <Text style={styles.label}>Email của bạn</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor="#7e6d99"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <MysticButton
                  title="Gửi Liên Kết Khôi Phục"
                  variant="primary"
                  size="lg"
                  onPress={handleSubmit}
                  loading={submitting}
                  fullWidth
                  style={styles.submitBtn}
                />

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>Nhớ mật khẩu rồi? </Text>
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
    maxHeight: '85%',
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
    marginBottom: 8,
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
    lineHeight: 18,
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
    marginBottom: 16,
  },
  submitBtn: {
    marginTop: 4,
  },
  successBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: '#34d399',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 16,
    marginVertical: 12,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34d399',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 13,
    color: '#f5e6c8',
    lineHeight: 19,
  },
  boldText: {
    fontWeight: '700',
    color: '#fff3d1',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 13,
    color: '#9e8cb8',
  },
  loginLink: {
    fontSize: 13,
    color: '#d4af37',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordModal;
