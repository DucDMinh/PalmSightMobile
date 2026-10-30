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
                  <Text style={styles.submitBtnText}>Quay lại đăng nhập</Text>
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
                  placeholderTextColor="#9e8cb8"
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
                    <ActivityIndicator size="small" color="#0b0716" />
                  ) : (
                    <Text style={styles.submitBtnText}>Gửi liên kết đặt lại</Text>
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
  input: {
    backgroundColor: 'rgba(11, 7, 22, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f7e7b4',
    fontSize: 14,
    marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: '#d4af37',
    borderWidth: 1,
    borderColor: 'rgba(255, 243, 209, 0.65)',
    borderRadius: 9999,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
  successBox: {
    paddingVertical: 12,
  },
  successTitle: {
    color: '#34d399',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successDesc: {
    color: '#d8cbe8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#f7e7b4',
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
  loginLink: {
    color: '#f7e7b4',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordModal;
