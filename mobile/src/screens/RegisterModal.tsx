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
import authService from '../services/authService';
import { useAuth } from '../providers/AuthenticationProvider';
import { showError, showSuccess } from '../helpers/toast';
import { MysticButton } from '../components/MysticButton';

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
        `Đã gửi email kích hoạt tới ${res.email}. Vui lòng kiểm tra hộp thư để xác thực tài khoản!`,
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
            {/* Grab Handle */}
            <View style={styles.grabHandle} />

            <View style={styles.headerRow}>
              <View>
                <Text style={styles.badgeTop}>✦ GIA NHẬP PALMSIGHT ✦</Text>
                <Text style={styles.title}>Tạo Tài Khoản</Text>
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
                Tặng ngay <Text style={styles.goldText}>+3 credits miễn phí</Text> khi kích hoạt tài khoản thành công!
              </Text>

              {/* Display Name */}
              <Text style={styles.label}>Tên hiển thị</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="VD: Minh Trí"
                placeholderTextColor="#7e6d99"
              />

              {/* Username */}
              <Text style={styles.label}>Tên người dùng (username)</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="VD: minhtri99"
                placeholderTextColor="#7e6d99"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Email */}
              <Text style={styles.label}>Địa chỉ Email</Text>
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

              {/* Password */}
              <Text style={styles.label}>Mật khẩu (tối thiểu 8 ký tự)</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#7e6d99"
                secureTextEntry
              />

              {/* Confirm Password */}
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#7e6d99"
                secureTextEntry
              />

              {/* Referral Code (Optional) */}
              <Text style={styles.label}>Mã giới thiệu (nếu có, nhận thêm +1 credit)</Text>
              <TextInput
                style={styles.input}
                value={referralCode}
                onChangeText={setReferralCode}
                placeholder="Nhập mã 8 ký tự (VD: PALM1234)"
                placeholderTextColor="#7e6d99"
                autoCapitalize="characters"
                maxLength={8}
              />

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    termsAccepted && styles.checkboxBoxChecked,
                  ]}
                >
                  {termsAccepted && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của PalmSight.
                </Text>
              </TouchableOpacity>

              {/* Submit */}
              <MysticButton
                title="Đăng Ký & Nhận +3 Credits"
                variant="primary"
                size="lg"
                onPress={handleSubmit}
                loading={submitting}
                fullWidth
                style={styles.submitBtn}
              />

              {/* Social Login */}
              <SocialLoginButtons onSuccess={() => onClose()} />

              {/* Footer Switch to Login */}
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
    marginBottom: 4,
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
    marginBottom: 16,
  },
  goldText: {
    color: '#f7e7b4',
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f5e6c8',
    marginBottom: 5,
  },
  input: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#f5e6c8',
    fontSize: 13.5,
    marginBottom: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#d4af37',
    borderColor: '#f7e7b4',
  },
  checkMark: {
    color: '#0b0716',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    color: '#9e8cb8',
    flex: 1,
    lineHeight: 17,
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
  loginLink: {
    fontSize: 13,
    color: '#d4af37',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default RegisterModal;
