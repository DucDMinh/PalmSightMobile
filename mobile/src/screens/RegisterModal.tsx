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
                placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
              />

              {/* Username */}
              <Text style={styles.label}>Tên người dùng (username)</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Ví dụ: hoanglong_99"
                placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
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
                placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
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
                placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
                secureTextEntry
              />

              {/* Confirm Password */}
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
                secureTextEntry
              />

              {/* Referral Code */}
              <Text style={styles.label}>Mã giới thiệu (không bắt buộc)</Text>
              <TextInput
                style={styles.input}
                value={referralCode}
                onChangeText={setReferralCode}
                placeholder="8 ký tự (ví dụ: ABC12345)"
                placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
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
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>[ ĐĂNG KÝ TÀI KHOẢN ]</Text>
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
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  scrollContent: {
    paddingBottom: 20,
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
  claimBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
    marginVertical: 10,
  },
  claimBannerSymbol: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 16,
    marginRight: 10,
  },
  claimBannerText: {
    flex: 1,
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: PALMSIGHT_MOBILE_THEME.colors.goldDim,
    marginBottom: 6,
    marginTop: 6,
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
    marginBottom: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
  },
  checkboxTick: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 13,
    lineHeight: 18,
  },
  submitBtn: {
    height: 48,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
  loginLink: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '700',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

export default RegisterModal;
