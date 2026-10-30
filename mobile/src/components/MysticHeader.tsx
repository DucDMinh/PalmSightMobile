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
        accessibilityLabel="PALMSIGHT Home"
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
            >
              <Text style={styles.sparkleIcon}>✨</Text>
              <Text style={styles.creditPillText}>
                [{creditBalance ?? 0} CREDITS]
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={onGoAccount || onOpenSettings}
              activeOpacity={0.8}
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
              style={styles.loginLink}
              onPress={onGoLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>Đăng nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.trialPill}
              onPress={onOpenWallet}
              activeOpacity={0.8}
            >
              <Text style={styles.trialPillText}>Bói thử</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={onOpenSettings}
              activeOpacity={0.7}
              accessibilityLabel="Cài đặt"
            >
              <Text style={styles.settingsBtnText}>⚙️</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0b0716',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
    zIndex: 50,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1b1233',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  logoIcon: {
    fontSize: 18,
    color: '#f5d77f',
  },
  sparkleBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleBadgeText: {
    color: '#0b0716',
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 10,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 18,
    fontWeight: '800',
    color: '#f7e7b4',
    letterSpacing: 2,
    lineHeight: 20,
  },
  brandSubtitle: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#9e8cb8',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#241842',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: 9999,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sparkleIcon: {
    fontSize: 11,
  },
  creditPillText: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    color: '#f7e7b4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#d4af37',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 243, 209, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: '#0b0716',
    fontWeight: '900',
    fontSize: 15,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
  },
  loginLink: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  loginLinkText: {
    color: '#9e8cb8',
    fontSize: 13,
    fontWeight: '600',
  },
  trialPill: {
    backgroundColor: '#241842',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  trialPillText: {
    color: '#f7e7b4',
    fontSize: 12,
    fontWeight: '700',
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#140d26',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsBtnText: {
    fontSize: 13,
  },
});

export default MysticHeader;
