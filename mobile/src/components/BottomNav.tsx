import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';

export type TabKey = 'home' | 'scan' | 'history' | 'wallet' | 'account';

interface BottomNavProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'home', label: 'Trang Chủ', icon: '🏛️' },
    { key: 'scan', label: 'Xem Bói', icon: '🔮' },
    { key: 'history', label: 'Lịch Sử', icon: '📜' },
    { key: 'wallet', label: 'Ví Credits', icon: '🪙' },
    { key: 'account', label: 'Tài Khoản', icon: '👤' },
  ];

  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceSoft,
    borderTopWidth: 1,
    borderTopColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    paddingVertical: 6,
    paddingBottom: 16,
    justifyContent: 'space-around',
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    position: 'relative',
    minWidth: 64,
  },
  tabItemActive: {},
  icon: {
    fontSize: 18,
    opacity: 0.6,
    marginBottom: 2,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
  },
  labelActive: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
  },
});
