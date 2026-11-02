import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import type { UserDto } from '../interfaces/user';

interface MysticHeaderProps {
  user?: UserDto | null;
  creditBalance?: number | null;
  isLogged: boolean;
  onOpenWallet: () => void;
  onOpenSettings: () => void;
  onGoHome: () => void;
  onGoAccount?: () => void;
  onGoLogin?: () => void;
}

export const MysticHeader: React.FC<MysticHeaderProps> = ({
  user,
  creditBalance,
  isLogged,
  onOpenWallet,
  onOpenSettings,
  onGoHome,
  onGoAccount,
  onGoLogin,
}) => {
  const avatarLetter = (user?.displayName || user?.username || 'P')
    .charAt(0)
    .toUpperCase();

  return (
    <View style={styles.header}>
      {/* Brand logo & title */}
      <TouchableOpacity
        style={styles.brand}
        onPress={onGoHome}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="PALMSIGHT Trang chủ"
      >
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>✋</Text>
          <View style={styles.sparkleBadge}>
            <Text style={styles.sparkleBadgeText}>✦</Text>
          </View>
        </View>

        <View style={styles.brandTextCol}>
          <Text style={styles.brandTitle}>PALMSIGHT</Text>
          <Text style={styles.brandSubtitle}>HUYỀN CƠ CHỈ TAY</Text>
        </View>
      </TouchableOpacity>

      {/* Right actions */}
      <View style={styles.rightActions}>
        {isLogged ? (
          <>
            <TouchableOpacity
              style={styles.creditPill}
              onPress={onOpenWallet}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Ví ${creditBalance ?? 0} credits`}
            >
              <Text style={styles.creditCoin}>🪙</Text>
              <Text style={styles.creditPillText}>{creditBalance ?? 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={onGoAccount || onOpenSettings}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Trang cá nhân"
            >
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{avatarLetter}</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={onGoLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginBtnText}>Đăng nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.trialBadge}
              onPress={onOpenWallet}
              activeOpacity={0.8}
            >
              <Text style={styles.trialBadgeText}>✦ Bói thử</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={onOpenSettings}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cài đặt"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0b0716',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoIcon: {
    fontSize: 16,
  },
  sparkleBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleBadgeText: {
    fontSize: 8,
    color: '#0b0716',
    fontWeight: 'bold',
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 15,
    fontWeight: '700',
    color: '#f5e6c8',
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    fontSize: 8,
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: 1.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
  },
  creditCoin: {
    fontSize: 12,
  },
  creditPillText: {
    color: '#f7e7b4',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 32,
    height: 32,
  },
  avatarInitial: {
    color: '#f5e6c8',
    fontSize: 13,
    fontWeight: '700',
  },
  loginBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  loginBtnText: {
    color: '#f5e6c8',
    fontSize: 12,
    fontWeight: '600',
  },
  trialBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  trialBadgeText: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '600',
  },
  settingsBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 16,
    color: '#9e8cb8',
  },
});

export default MysticHeader;
