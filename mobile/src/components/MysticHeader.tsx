import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';

interface MysticHeaderProps {
  creditBalance?: number | null;
  isLogged: boolean;
  onOpenWallet: () => void;
  onOpenSettings: () => void;
  onGoHome: () => void;
}

export const MysticHeader: React.FC<MysticHeaderProps> = ({
  creditBalance,
  isLogged,
  onOpenWallet,
  onOpenSettings,
  onGoHome,
}) => {
  return (
    <View style={styles.header}>
      {/* Brand logo & title */}
      <TouchableOpacity style={styles.brand} onPress={onGoHome} activeOpacity={0.8}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>✋</Text>
          <Text style={styles.sparkleBadge}>✦</Text>
        </View>
        <View style={styles.brandTextCol}>
          <Text style={styles.brandTitle}>PALMSIGHT</Text>
          <Text style={styles.brandSubtitle}>HUYỀN CƠ CHỈ TAY</Text>
        </View>
      </TouchableOpacity>

      {/* Right actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.creditPill}
          onPress={onOpenWallet}
          activeOpacity={0.8}
        >
          <Text style={styles.creditPillText}>
            🪙 {isLogged ? `${creditBalance ?? 0} Credits` : 'Bói thử'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
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
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoIcon: {
    fontSize: 18,
  },
  sparkleBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    color: PALMSIGHT_MOBILE_THEME.colors.canvas,
    fontSize: 8,
    fontWeight: '900',
    borderRadius: 6,
    paddingHorizontal: 2,
    overflow: 'hidden',
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    letterSpacing: 1.2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditPill: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
  },
  creditPillText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 12,
    fontWeight: '700',
  },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsBtnText: {
    fontSize: 14,
  },
});
