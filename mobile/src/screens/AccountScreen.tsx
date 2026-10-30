import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import { useAuth } from '../providers/AuthenticationProvider';
import accountService from '../services/accountService';
import authService from '../services/authService';
import { showError, showSuccess } from '../helpers/toast';

interface AccountScreenProps {
  onGoWallet: () => void;
  onGoLogin: () => void;
  onGoChangePassword: () => void;
}

const ERROR_MESSAGE_MAP: Record<string, string> = {
  REFERRAL_SELF: 'Bạn không thể nhập mã của chính mình.',
  REFERRAL_CODE_NOT_FOUND: 'Mã không tồn tại, vui lòng kiểm tra lại.',
  REFERRAL_ALREADY_USED: 'Tài khoản đã nhập mã giới thiệu trước đó.',
  REFERRAL_CYCLE: 'Không thể nhập mã của người bạn đã mời.',
  REFERRAL_NOT_ALLOWED: 'Tài khoản không đủ điều kiện nhập mã.',
};

export const AccountScreen: React.FC<AccountScreenProps> = ({
  onGoWallet,
  onGoLogin,
  onGoChangePassword,
}) => {
  const { user, isLogged, logout, refreshProfile, updateUser } = useAuth();

  // Enter Referral State
  const [referralInput, setReferralInput] = useState('');
  const [submittingRef, setSubmittingRef] = useState(false);
  const [refSuccessMsg, setRefSuccessMsg] = useState<string | null>(null);

  // Set Password State for social-only users
  const [sendingSetPw, setSendingSetPw] = useState(false);

  // Copy states
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!isLogged || !user) {
    return (
      <View style={styles.centerBox}>
        <TarotCard style={styles.promptCard}>
          <Text style={styles.badgeTop}>✦ HỒ SƠ THIÊN MỆNH</Text>
          <Text style={styles.promptTitle}>Tài khoản người dùng</Text>
          <Text style={styles.promptDesc}>
            Đăng nhập để xem thông tin cá nhân, quản lý ví credits và chia sẻ mã giới thiệu bạn bè.
          </Text>
          <TouchableOpacity style={styles.loginBtn} onPress={onGoLogin}>
            <Text style={styles.loginBtnText}>[ ĐĂNG NHẬP / ĐĂNG KÝ ]</Text>
          </TouchableOpacity>
        </TarotCard>
      </View>
    );
  }

  const initialLetter = (user.displayName || user.username || 'P')
    .charAt(0)
    .toUpperCase();

  const handleCopyId = async () => {
    if (!user.id) return;
    try {
      await Clipboard.setStringAsync(user.id);
    } catch {}
    setCopiedId(true);
    showSuccess('Đã sao chép ID tài khoản.');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyCode = async () => {
    const code = user.referralCode || '';
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
    } catch {}
    setCopiedCode(true);
    showSuccess('Đã sao chép mã giới thiệu!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareLink =
    user.referralLink || `https://palmsight.app/r/${user.referralCode || ''}`;

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(shareLink);
    } catch {}
    setCopiedLink(true);
    showSuccess('Đã sao chép liên kết giới thiệu!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const sampleMessage = user.referralCode
    ? `Nhập mã ${user.referralCode} trên PalmSight để nhận ngay 1 credit xem bói vận mệnh miễn phí!`
    : '';

  const handleCopyMessage = async () => {
    if (!sampleMessage) return;
    try {
      await Clipboard.setStringAsync(sampleMessage);
    } catch {}
    setCopiedMsg(true);
    showSuccess('Đã sao chép câu mời mẫu!');
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleEnterReferral = async () => {
    const trimmed = referralInput.trim().toUpperCase();
    if (!trimmed || trimmed.length < 3) {
      showError('Vui lòng nhập mã giới thiệu hợp lệ.');
      return;
    }

    setSubmittingRef(true);
    setRefSuccessMsg(null);
    try {
      const res = await accountService.enterReferral(trimmed);
      if (typeof res.creditBalance === 'number') {
        updateUser({
          creditBalance: res.creditBalance,
          referral: {
            canEnterCode: false,
            enteredCode: trimmed,
          },
        });
      }
      const referrer = res.referrer?.displayName || 'bạn bè';
      setRefSuccessMsg(`[✓] Đã ghi nhận mã của ${referrer}! Bạn được cộng 1 credit.`);
      showSuccess(`Bạn được cộng 1 credit từ ${referrer}!`);
      setReferralInput('');
      refreshProfile();
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      const msg =
        (code && ERROR_MESSAGE_MAP[code]) ||
        err?.response?.data?.error?.message ||
        'Không thể xử lý mã giới thiệu. Vui lòng kiểm tra lại.';
      showError(msg, 'Nhập mã');
    } finally {
      setSubmittingRef(false);
    }
  };

  const handleSendSetPasswordLink = async () => {
    if (!user.email) {
      showError('Tài khoản chưa có email để nhận link đặt mật khẩu.');
      return;
    }
    setSendingSetPw(true);
    try {
      await authService.postForgotPassword({ email: user.email });
      showSuccess(
        `Đã gửi link thiết lập mật khẩu tới ${user.email}. Vui lòng kiểm tra email của bạn!`,
        'Thiết lập mật khẩu'
      );
    } catch (err: any) {
      showError('Không thể gửi link lúc này. Vui lòng thử lại sau.');
    } finally {
      setSendingSetPw(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          showSuccess('Đã đăng xuất thành công.');
        },
      },
    ]);
  };

  const providersText = () => {
    const list: string[] = [];
    if (user.hasPassword) list.push('Mật khẩu');
    if (user.providers?.includes('GOOGLE' as any)) list.push('Google');
    if (user.providers?.includes('FACEBOOK' as any)) list.push('Facebook');
    return list.length > 0 ? list.join(' · ') : 'Mật khẩu';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 1. Profile Section */}
      <TarotCard style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{initialLetter}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.username}>@{user.username || 'user'}</Text>
            <View style={styles.emailRow}>
              <Text style={styles.emailText}>{user.email || 'Không có email'}</Text>
              {user.email && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓ Đã xác thực</Text>
                </View>
              )}
            </View>
            <Text style={styles.providerInfo}>
              Phương thức đăng nhập: {providersText()}
            </Text>
          </View>
        </View>

        {/* Account ID */}
        <View style={styles.idRow}>
          <View style={styles.idTextWrap}>
            <Text style={styles.idLabel}>ID TÀI KHOẢN</Text>
            <Text style={styles.idValue} numberOfLines={1}>
              {user.id}
            </Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyId}>
            <Text style={styles.copyBtnText}>
              {copiedId ? '✓ Đã chép' : 'Sao chép ID'}
            </Text>
          </TouchableOpacity>
        </View>
      </TarotCard>

      {/* 2. Wallet Quick Card */}
      <TarotCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>✦ Ví Credits</Text>
          <TouchableOpacity onPress={onGoWallet}>
            <Text style={styles.cardLink}>Xem chi tiết &rarr;</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.creditBalance}>{user.creditBalance ?? 0} Credits</Text>
        <Text style={styles.cardDesc}>
          Mỗi lần xem bói tiêu thụ 1 credit. Credits không có hạn sử dụng.
        </Text>
      </TarotCard>

      {/* 3. Enter Referral Section */}
      {user.referral?.canEnterCode !== false && (
        <TarotCard style={styles.card}>
          <Text style={styles.cardTitle}>✦ Nhập Mã Giới Thiệu (+1 Credit)</Text>
          <Text style={styles.cardDesc}>
            Nhập mã từ bạn bè của bạn để nhận ngay 1 credit xem bói miễn phí.
          </Text>

          {refSuccessMsg && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>{refSuccessMsg}</Text>
            </View>
          )}

          <View style={styles.referralInputRow}>
            <TextInput
              style={styles.refInput}
              value={referralInput}
              onChangeText={setReferralInput}
              placeholder="MÃ GIỚI THIỆU"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleEnterReferral}
              disabled={submittingRef}
            >
              {submittingRef ? (
                <ActivityIndicator size="small" color="#120a21" />
              ) : (
                <Text style={styles.applyBtnText}>ÁP DỤNG</Text>
              )}
            </TouchableOpacity>
          </View>
        </TarotCard>
      )}

      {/* 4. Referral Share Section */}
      <TarotCard style={styles.card}>
        <Text style={styles.cardTitle}>✦ Giới Thiệu Bạn Bè</Text>
        <Text style={styles.cardDesc}>
          Chia sẻ mã để bạn bè nhận +1 credit và bạn cũng được nhận thêm +1 credit khi họ xem bói!
        </Text>

        {/* Code */}
        <Text style={styles.subLabel}>MÃ CỦA BẠN</Text>
        <View style={styles.shareBox}>
          <Text style={styles.codeHighlight}>{user.referralCode || '—'}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
            <Text style={styles.copyBtnText}>
              {copiedCode ? '✓ Đã chép' : 'Sao chép mã'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Link */}
        <Text style={styles.subLabel}>LIÊN KẾT GIỚI THIỆU</Text>
        <View style={styles.shareBox}>
          <Text style={styles.linkText} numberOfLines={1}>
            {shareLink}
          </Text>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
            <Text style={styles.copyBtnText}>
              {copiedLink ? '✓ Đã chép' : 'Sao chép'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Message */}
        {sampleMessage ? (
          <TouchableOpacity
            style={styles.sampleMsgBtn}
            onPress={handleCopyMessage}
          >
            <Text style={styles.sampleMsgText}>
              {copiedMsg ? '✓ Đã sao chép tin nhắn mẫu!' : '📋 Sao chép tin nhắn mời bạn bè'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </TarotCard>

      {/* 5. Security Section */}
      <TarotCard style={styles.card}>
        <Text style={styles.cardTitle}>✦ Bảo Mật Tài Khoản</Text>
        {user.hasPassword ? (
          <View style={styles.securityRow}>
            <View style={styles.securityTextWrap}>
              <Text style={styles.securityTitle}>Mật khẩu tài khoản</Text>
              <Text style={styles.securityDesc}>
                Đổi mật khẩu định kỳ giúp bảo vệ tài khoản an toàn hơn.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changePwBtn}
              onPress={onGoChangePassword}
            >
              <Text style={styles.changePwBtnText}>Đổi mật khẩu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.securityRow}>
            <View style={styles.securityTextWrap}>
              <Text style={styles.securityTitle}>Thiết lập mật khẩu</Text>
              <Text style={styles.securityDesc}>
                Bạn đang đăng nhập qua Google. Đặt mật khẩu để đăng nhập bằng email.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changePwBtn}
              onPress={handleSendSetPasswordLink}
              disabled={sendingSetPw}
            >
              <Text style={styles.changePwBtnText}>
                {sendingSetPw ? 'Đang gửi...' : 'Đặt mật khẩu'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TarotCard>

      {/* 6. Logout Action */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>🚪 ĐĂNG XUẤT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
  },
  centerBox: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  promptCard: {
    alignItems: 'center',
    padding: 28,
  },
  badgeTop: {
    fontSize: 10,
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 6,
  },
  promptTitle: {
    fontSize: 24,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 8,
  },
  promptDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  loginBtnText: {
    color: '#120a21',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    padding: 18,
    marginBottom: 14,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  username: {
    fontSize: 13,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    marginBottom: 2,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 2,
  },
  emailText: {
    fontSize: 13,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderWidth: 1,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    color: PALMSIGHT_MOBILE_THEME.colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  providerInfo: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    marginTop: 2,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    padding: 10,
    marginTop: 14,
  },
  idTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  idLabel: {
    fontSize: 10,
    color: PALMSIGHT_MOBILE_THEME.colors.goldDim,
    fontWeight: '700',
    letterSpacing: 1,
  },
  idValue: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginTop: 2,
  },
  copyBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  copyBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  cardLink: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 12,
    fontWeight: 'bold',
  },
  creditBalance: {
    fontSize: 26,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    marginVertical: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    lineHeight: 18,
    marginTop: 2,
  },
  successBanner: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    padding: 8,
    marginVertical: 8,
  },
  successBannerText: {
    color: PALMSIGHT_MOBILE_THEME.colors.success,
    fontSize: 12,
  },
  referralInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  refInput: {
    flex: 1,
    height: 42,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    paddingHorizontal: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 13,
    fontWeight: 'bold',
  },
  applyBtn: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#120a21',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  subLabel: {
    fontSize: 10,
    color: PALMSIGHT_MOBILE_THEME.colors.goldDim,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  shareBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    padding: 10,
    marginBottom: 4,
  },
  codeHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    letterSpacing: 2,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    marginRight: 8,
  },
  sampleMsgBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  sampleMsgText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 12,
    fontWeight: '600',
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  securityTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  securityTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  securityDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  changePwBtn: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  changePwBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutBtn: {
    padding: 16,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    backgroundColor: 'rgba(251, 113, 133, 0.12)',
    borderColor: 'rgba(251, 113, 133, 0.3)',
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoutBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});

export default AccountScreen;
