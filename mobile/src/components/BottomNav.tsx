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
    { key: 'home', label: 'Trang chủ', icon: '🏛️' },
    { key: 'scan', label: 'Xem bói', icon: '✨' },
    { key: 'history', label: 'Lịch sử', icon: '📜' },
    { key: 'wallet', label: 'Ví credits', icon: '🪙' },
    { key: 'account', label: 'Tài khoản', icon: '👤' },
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
    backgroundColor: '#0b0716',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.25)',
    paddingVertical: 8,
    paddingBottom: 16,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    position: 'relative',
    minWidth: 60,
  },
  tabItemActive: {},
  icon: {
    fontSize: 18,
    opacity: 0.6,
    marginBottom: 3,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9e8cb8',
  },
  labelActive: {
    color: '#f7e7b4',
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#d4af37',
  },
});

export default BottomNav;
