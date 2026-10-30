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
import authService from '../services/authService';
import { useAuth } from '../providers/AuthenticationProvider';
import { showError, showSuccess } from '../helpers/toast';

interface RegisterModalProps {
  visible: boolean;
  onClose: () => void;
  onGoLogin: () => void;
  initialReferralCode?: string;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  visible,
  onClose,
  onGoLogin,
  initialReferralCode = '',
}) => {
  const { claimToken } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      showError('Vui lòng nhập tên hiển thị.', 'Thông báo');
      return;
    }
    if (!username.trim() || username.length < 3) {
      showError('Tên người dùng phải từ 3 ký tự trở lên (a-z, 0-9, _).', 'Thông báo');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showError('Vui lòng nhập địa chỉ email hợp lệ.', 'Thông báo');
      return;
    }
    if (!password || password.length < 8) {
      showError('Mật khẩu phải có ít nhất 8 ký tự.', 'Thông báo');
      return;
    }
    if (password !== confirmPassword) {
      showError('Mật khẩu xác nhận không khớp.', 'Thông báo');
      return;
    }
    if (!termsAccepted) {
      showError('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách riêng tư.', 'Thông báo');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.postRegister({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        referralCode: referralCode.trim() ? referralCode.trim().toUpperCase() : undefined,
        claimToken: claimToken || undefined,
      });

      showSuccess(
        `Đã gửi email kích hoạt tới ${res.email}. Vui lòng kiểm tra hòm thư để xác thực!`,
        'Đăng ký thành công'
      );
      onClose();
      onGoLogin();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
      showError(msg, 'Đăng ký');
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
                <Text style={styles.badgeTop}>✦ KHỞI TẠO DUYÊN LÀNH</Text>
                <Text style={styles.title}>Đăng ký tài khoản</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {claimToken && (
                <View style={styles.claimBanner}>
                  <Text style={styles.claimBannerSymbol}>✦</Text>
                  <Text style={styles.claimBannerText}>
                    Bạn đang có 1 bài bói thử. Tài khoản sẽ tự động mở khóa 100% quẻ
                    sau khi hoàn tất đăng ký!
                  </Text>
                </View>
              )}

              {/* Display Name */}
              <Text style={styles.label}>Tên hiển thị</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Ví dụ: Hoàng Long"
                placeholderTextColor="#9e8cb8"
              />

              {/* Username */}
              <Text style={styles.label}>Tên người dùng (username)</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Ví dụ: hoanglong_99"
                placeholderTextColor="#9e8cb8"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Email */}
              <Text style={styles.label}>Địa chỉ Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="hoanglong@example.com"
                placeholderTextColor="#9e8cb8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Password */}
              <Text style={styles.label}>Mật khẩu (ít nhất 8 ký tự)</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9e8cb8"
                secureTextEntry
              />

              {/* Confirm Password */}
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#9e8cb8"
                secureTextEntry
              />

              {/* Referral Code */}
              <Text style={styles.label}>Mã giới thiệu (không bắt buộc)</Text>
              <TextInput
                style={styles.input}
                value={referralCode}
                onChangeText={setReferralCode}
                placeholder="8 ký tự (ví dụ: ABC12345)"
                placeholderTextColor="#9e8cb8"
                autoCapitalize="characters"
              />

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkbox,
                    termsAccepted && styles.checkboxChecked,
                  ]}
                >
                  {termsAccepted && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  Tôi đồng ý với Điều khoản dịch vụ & Chính sách riêng tư của PalmSight.
                </Text>
              </TouchableOpacity>

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
                  <Text style={styles.submitBtnText}>Đăng ký tài khoản</Text>
                )}
              </TouchableOpacity>

              {/* Social Login with Google */}
              <SocialLoginButtons
                claimToken={claimToken}
                onSuccess={() => onClose()}
              />

              {/* Switch to Login */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={onGoLogin}>
                  <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
    maxHeight: '92%',
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
  scrollContent: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  claimBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(44, 29, 79, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  claimBannerSymbol: {
    color: '#d4af37',
    fontSize: 14,
  },
  claimBannerText: {
    flex: 1,
    color: '#f7e7b4',
    fontSize: 12,
    lineHeight: 18,
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
    paddingVertical: 11,
    color: '#f7e7b4',
    fontSize: 14,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.6)',
    backgroundColor: '#0b0716',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#d4af37',
  },
  checkboxTick: {
    color: '#0b0716',
    fontSize: 12,
    fontWeight: '900',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: '#d8cbe8',
    lineHeight: 17,
  },
  submitBtn: {
    backgroundColor: '#d4af37',
    borderWidth: 1,
    borderColor: 'rgba(255, 243, 209, 0.65)',
    borderRadius: 9999,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
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
    marginTop: 18,
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

export default RegisterModal;
