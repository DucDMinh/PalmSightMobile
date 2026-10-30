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
          <Text style={styles.promptTitle}>Tài khoản</Text>
          <Text style={styles.promptDesc}>
            Đăng nhập để xem thông tin cá nhân, quản lý ví credits và chia sẻ mã giới thiệu bạn bè.
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={onGoLogin}>
            <Text style={styles.btnPrimaryText}>Đăng nhập / Đăng ký</Text>
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
    } catch {
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
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
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
              Phương thức: {providersText()}
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
          <Text style={styles.cardTitle}>✦ Ví credits</Text>
          <TouchableOpacity onPress={onGoWallet}>
            <Text style={styles.cardLink}>Xem chi tiết &rarr;</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.creditBalance}>{user.creditBalance ?? 0} credits</Text>
        <Text style={styles.cardDesc}>
          Mỗi lần xem bói tiêu thụ 1 credit. Credits không có hạn sử dụng.
        </Text>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={onGoWallet}
          activeOpacity={0.8}
        >
          <Text style={styles.btnSecondaryText}>Ví credits &rarr;</Text>
        </TouchableOpacity>
      </TarotCard>

      {/* 3. Enter Referral Section */}
      {user.referral?.canEnterCode !== false && (
        <TarotCard style={styles.card}>
          <Text style={styles.cardTitle}>✦ Nhập mã giới thiệu (+1 Credit)</Text>
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
              placeholderTextColor="#9e8cb8"
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.btnPrimarySmall}
              onPress={handleEnterReferral}
              disabled={submittingRef}
            >
              {submittingRef ? (
                <ActivityIndicator size="small" color="#0b0716" />
              ) : (
                <Text style={styles.btnPrimarySmallText}>Áp dụng</Text>
              )}
            </TouchableOpacity>
          </View>
        </TarotCard>
      )}

      {/* 4. Referral Share Section */}
      <TarotCard style={styles.card}>
        <Text style={styles.cardTitle}>✦ Giới thiệu bạn bè</Text>
        <Text style={styles.cardDesc}>
          Chia sẻ mã để bạn bè nhận +1 credit và bạn nhận ngay +2 credits khi họ xem bói!
        </Text>

        <View style={styles.refBox}>
          <Text style={styles.refBoxLabel}>MÃ GIỚI THIỆU CỦA BẠN</Text>
          <View style={styles.refBoxRow}>
            <Text style={styles.refCodeText}>{user.referralCode || 'CHƯA CÓ'}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
              <Text style={styles.copyBtnText}>
                {copiedCode ? '✓ Đã chép' : 'Sao chép mã'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.refActionsRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={handleCopyLink}>
            <Text style={styles.btnSecondaryText}>
              {copiedLink ? '✓ Đã chép link' : 'Sao chép link mời'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={handleCopyMessage}>
            <Text style={styles.btnSecondaryText}>
              {copiedMsg ? '✓ Đã chép câu mời' : 'Sao chép lời mời'}
            </Text>
          </TouchableOpacity>
        </View>
      </TarotCard>

      {/* 5. Security & Password Section */}
      <TarotCard style={styles.card}>
        <Text style={styles.cardTitle}>✦ Bảo mật & Mật khẩu</Text>
        <Text style={styles.cardDesc}>
          {user.hasPassword
            ? 'Thay đổi mật khẩu đăng nhập tài khoản thường xuyên để nâng cao tính an toàn.'
            : 'Tài khoản đăng nhập qua mạng xã hội. Bạn có thể tạo mật khẩu để đăng nhập trực tiếp bằng email.'}
        </Text>

        <View style={styles.securityActionRow}>
          {user.hasPassword ? (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={onGoChangePassword}
            >
              <Text style={styles.btnSecondaryText}>Đổi mật khẩu</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={handleSendSetPasswordLink}
              disabled={sendingSetPw}
            >
              {sendingSetPw ? (
                <ActivityIndicator size="small" color="#f5e6c8" />
              ) : (
                <Text style={styles.btnSecondaryText}>Tạo mật khẩu cho tài khoản</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
            <Text style={styles.btnLogoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </TarotCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
    backgroundColor: '#0b0716',
  },
  centerBox: {
    flex: 1,
    backgroundColor: '#0b0716',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  promptCard: {
    alignItems: 'center',
    padding: 28,
  },
  badgeTop: {
    fontSize: 11,
    color: '#d4af37',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 4,
  },
  promptTitle: {
    fontSize: 26,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 10,
  },
  promptDesc: {
    fontSize: 13,
    color: '#d8cbe8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  card: {
    marginBottom: 16,
    padding: 18,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 243, 209, 0.7)',
  },
  avatarLetter: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 24,
    fontWeight: '900',
    color: '#0b0716',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 20,
    fontWeight: '800',
    color: '#f7e7b4',
  },
  username: {
    fontSize: 12,
    color: '#9e8cb8',
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 13,
    color: '#d8cbe8',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  verifiedBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
  },
  providerInfo: {
    fontSize: 11,
    color: '#9e8cb8',
  },

  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  idTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  idLabel: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#c5a059',
    letterSpacing: 1,
  },
  idValue: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 11,
    color: '#d8cbe8',
    marginTop: 2,
  },
  copyBtn: {
    backgroundColor: 'rgba(27, 18, 51, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnText: {
    color: '#f7e7b4',
    fontSize: 11,
    fontWeight: '600',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 18,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 4,
  },
  cardLink: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '700',
  },
  creditBalance: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 32,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#d8cbe8',
    lineHeight: 19,
    marginBottom: 14,
  },

  successBanner: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  successBannerText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  referralInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  refInput: {
    flex: 1,
    backgroundColor: 'rgba(11, 7, 22, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#f7e7b4',
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 13,
    fontWeight: '700',
  },
  btnPrimarySmall: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimarySmallText: {
    color: '#0b0716',
    fontWeight: '700',
    fontSize: 13,
  },

  refBox: {
    backgroundColor: 'rgba(11, 7, 22, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  refBoxLabel: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#c5a059',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  refBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refCodeText: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 22,
    fontWeight: '900',
    color: '#f7e7b4',
    letterSpacing: 2,
  },
  refActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  securityActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  btnSecondary: {
    backgroundColor: 'rgba(27, 18, 51, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: '#f5e6c8',
    fontSize: 13,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#0b0716',
    fontSize: 13,
    fontWeight: '700',
  },
  btnLogout: {
    backgroundColor: 'rgba(76, 5, 25, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLogoutText: {
    color: '#fb7185',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default AccountScreen;
