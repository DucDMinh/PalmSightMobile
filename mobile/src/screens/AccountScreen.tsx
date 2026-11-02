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
import { MysticButton } from '../components/MysticButton';
import { MysticBadge } from '../components/MysticBadge';

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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isLogged || !user) {
    return (
      <View style={styles.centerBox}>
        <TarotCard style={styles.promptCard}>
          <Text style={styles.badgeTop}>✦ HỒ SƠ THIÊN MỆNH ✦</Text>
          <Text style={styles.promptTitle}>Tài Khoản</Text>
          <Text style={styles.promptDesc}>
            Đăng nhập để xem thông tin cá nhân, quản lý kho linh thạch và chia sẻ mã giới thiệu bạn bè.
          </Text>
          <MysticButton
            title="Đăng nhập / Đăng ký"
            icon="✨"
            variant="primary"
            size="md"
            onPress={onGoLogin}
            fullWidth
          />
        </TarotCard>
      </View>
    );
  }

  const initialLetter = (user.displayName || user.username || 'P')
    .charAt(0)
    .toUpperCase();

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
    showSuccess('Đã sao chép đường link giới thiệu!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApplyReferral = async () => {
    const code = referralInput.trim().toUpperCase();
    if (!code) {
      showError('Vui lòng nhập mã giới thiệu 8 ký tự.');
      return;
    }

    setSubmittingRef(true);
    try {
      const res = await accountService.enterReferral(code);
      setRefSuccessMsg(
        `Chúc mừng bạn! Đã nhận thành công +${res.creditsEarned || 1} credit thưởng.`
      );
      setReferralInput('');
      updateUser({
        creditBalance: res.creditBalance,
      });
      refreshProfile();
      showSuccess(`+${res.creditsEarned || 1} credit đã cộng vào ví!`, 'Thành công');
    } catch (err: any) {
      const codeErr = err?.response?.data?.error?.code;
      const msg =
        ERROR_MESSAGE_MAP[codeErr] ||
        err?.response?.data?.error?.message ||
        'Không thể áp dụng mã giới thiệu lúc này.';
      showError(msg);
    } finally {
      setSubmittingRef(false);
    }
  };

  const handleSendSetPasswordEmail = async () => {
    if (!user.email) return;
    setSendingSetPw(true);
    try {
      await authService.postForgotPassword({ email: user.email });
      Alert.alert(
        'Đã gửi liên kết',
        `Chúng tôi đã gửi đường dẫn thiết lập mật khẩu đến ${user.email}. Vui lòng kiểm tra hộp thư.`
      );
    } catch (err: any) {
      showError(err?.message || 'Không thể gửi email đặt mật khẩu.');
    } finally {
      setSendingSetPw(false);
    }
  };

  const handleConfirmLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. USER PROFILE CARD */}
      <TarotCard style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initialLetter}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>
                {user.displayName || user.username}
              </Text>
              <MysticBadge label="Đã xác thực" icon="✓" variant="emerald" size="sm" />
            </View>
            <Text style={styles.emailText}>{user.email}</Text>
            {user.username && user.username !== user.email && (
              <Text style={styles.usernameText}>@{user.username}</Text>
            )}
          </View>
        </View>

        {/* Balance Row */}
        <View style={styles.balanceBar}>
          <View style={styles.balanceLeft}>
            <Text style={styles.balanceLabel}>SỐ DƯ CREDITS</Text>
            <Text style={styles.balanceValue}>🪙 {user.creditBalance ?? 0} Credits</Text>
          </View>
          <MysticButton
            title="Ví credits →"
            variant="secondary"
            size="sm"
            onPress={onGoWallet}
          />
        </View>
      </TarotCard>

      {/* 2. NHẬP MÃ GIỚI THIỆU */}
      <TarotCard style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionRune}>🎁</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Nhập Mã Giới Thiệu Bạn Bè</Text>
            <Text style={styles.sectionSubtitle}>
              Được tặng ngay +1 credit để khai quẻ bói miễn phí.
            </Text>
          </View>
        </View>

        {user.referral?.enteredCode ? (
          <View style={styles.usedNotice}>
            <Text style={styles.usedNoticeText}>
              ✓ Bạn đã nhập mã giới thiệu: <Text style={styles.usedCodeText}>{user.referral.enteredCode}</Text>
            </Text>
          </View>
        ) : (
          <View style={styles.enterCodeForm}>
            {refSuccessMsg && (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>{refSuccessMsg}</Text>
              </View>
            )}
            <View style={styles.inputActionRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập mã 8 ký tự (VD: PALM1234)"
                placeholderTextColor="#7e6d99"
                value={referralInput}
                onChangeText={setReferralInput}
                autoCapitalize="characters"
                maxLength={8}
              />
              <MysticButton
                title={submittingRef ? '...' : 'Áp dụng'}
                variant="primary"
                size="sm"
                onPress={handleApplyReferral}
                disabled={submittingRef || !referralInput.trim()}
              />
            </View>
          </View>
        )}
      </TarotCard>

      {/* 3. CHIA SẺ MÃ CỦA BẠN */}
      <TarotCard style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionRune}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Mã Giới Thiệu Của Bạn</Text>
            <Text style={styles.sectionSubtitle}>
              Mỗi người bạn đăng ký và nhập mã, bạn nhận +2 credits và bạn của bạn nhận +1 credit.
            </Text>
          </View>
        </View>

        {/* Code Box */}
        <View style={styles.shareItem}>
          <View style={styles.shareItemInfo}>
            <Text style={styles.shareItemLabel}>MÃ GIỚI THIỆU</Text>
            <Text style={styles.shareItemValue}>{user.referralCode || '...'}</Text>
          </View>
          <MysticButton
            title={copiedCode ? '✓ Đã chép' : 'Sao chép mã'}
            variant="secondary"
            size="sm"
            onPress={handleCopyCode}
          />
        </View>

        {/* Link Box */}
        <View style={styles.shareItem}>
          <View style={[styles.shareItemInfo, { flex: 1, paddingRight: 8 }]}>
            <Text style={styles.shareItemLabel}>LIÊN KẾT TRỰC TIẾP</Text>
            <Text style={styles.shareItemValueSmall} numberOfLines={1}>
              {shareLink}
            </Text>
          </View>
          <MysticButton
            title={copiedLink ? '✓ Đã chép' : 'Chép link'}
            variant="secondary"
            size="sm"
            onPress={handleCopyLink}
          />
        </View>
      </TarotCard>

      {/* 4. SECURITY & ACTIONS */}
      <TarotCard style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionRune}>🔒</Text>
          <Text style={styles.sectionTitle}>Bảo Mật & Quản Trị</Text>
        </View>

        <View style={styles.actionLinksList}>
          {user.hasPassword ? (
            <TouchableOpacity
              style={styles.actionLinkRow}
              onPress={onGoChangePassword}
              activeOpacity={0.7}
            >
              <Text style={styles.actionLinkText}>🔑 Đổi mật khẩu tài khoản</Text>
              <Text style={styles.actionLinkArrow}>→</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionLinkRow}
              onPress={handleSendSetPasswordEmail}
              disabled={sendingSetPw}
              activeOpacity={0.7}
            >
              <Text style={styles.actionLinkText}>
                {sendingSetPw
                  ? 'Đang gửi...'
                  : '🔑 Đặt mật khẩu đăng nhập email'}
              </Text>
              <Text style={styles.actionLinkArrow}>→</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionLinkRow, styles.logoutRow]}
            onPress={handleConfirmLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>🚪 Đăng xuất khỏi thiết bị</Text>
            <Text style={styles.logoutText}>→</Text>
          </TouchableOpacity>
        </View>
      </TarotCard>

      {/* Footer Disclaimer */}
      <View style={styles.footerNote}>
        <Text style={styles.footerNoteText}>
          PalmSight v1.0.0 · Mọi bài bói mang tính chất chiêm đoán giải trí.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
    gap: 14,
  },
  centerBox: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  promptCard: {
    alignItems: 'center',
    padding: 24,
    width: '100%',
    gap: 12,
  },
  badgeTop: {
    fontSize: 10.5,
    color: '#d4af37',
    letterSpacing: 2,
    fontWeight: '700',
  },
  promptTitle: {
    fontSize: 22,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
  },
  promptDesc: {
    fontSize: 13.5,
    color: '#9e8cb8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },

  // PROFILE CARD
  profileCard: {
    padding: 16,
    gap: 14,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f7e7b4',
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  displayName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f5e6c8',
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
  },
  emailText: {
    fontSize: 12.5,
    color: '#9e8cb8',
  },
  usernameText: {
    fontSize: 11.5,
    color: '#7e6d99',
    marginTop: 1,
  },
  balanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
  },
  balanceLeft: {
    gap: 2,
  },
  balanceLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f7e7b4',
  },

  // SECTION CARD
  sectionCard: {
    padding: 16,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionRune: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f5e6c8',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9e8cb8',
    marginTop: 2,
    lineHeight: 17,
  },

  // ENTER CODE
  usedNotice: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 10,
  },
  usedNoticeText: {
    fontSize: 12.5,
    color: '#6ee7b7',
  },
  usedCodeText: {
    fontWeight: '700',
    color: '#fff3d1',
  },
  enterCodeForm: {
    gap: 8,
  },
  successBanner: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: '#34d399',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    padding: 8,
  },
  successBannerText: {
    fontSize: 12,
    color: '#34d399',
    fontWeight: '600',
  },
  inputActionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: '#f5e6c8',
    fontSize: 13,
  },

  // SHARE
  shareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
  },
  shareItemInfo: {
    gap: 2,
  },
  shareItemLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: 1,
  },
  shareItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff3d1',
    letterSpacing: 1.5,
  },
  shareItemValueSmall: {
    fontSize: 11.5,
    color: '#d8cbe8',
  },

  // ACTION LINKS
  actionLinksList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
    paddingTop: 4,
  },
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  actionLinkText: {
    fontSize: 13.5,
    color: '#f5e6c8',
    fontWeight: '500',
  },
  actionLinkArrow: {
    fontSize: 14,
    color: '#9e8cb8',
  },
  logoutRow: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 13.5,
    color: '#fb7185',
    fontWeight: '600',
  },

  footerNote: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerNoteText: {
    fontSize: 11,
    color: '#6a5885',
    textAlign: 'center',
  },
});

export default AccountScreen;
