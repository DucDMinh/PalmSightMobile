import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';

export type TabKey = 'home' | 'scan' | 'history' | 'wallet' | 'account';

interface BottomNavProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { key: TabKey; label: string; symbol: string; isAction?: boolean }[] = [
    { key: 'home', label: 'Trang chủ', symbol: '🏛' },
    { key: 'history', label: 'Lịch sử', symbol: '📜' },
    { key: 'scan', label: 'Xem bói', symbol: '✋', isAction: true },
    { key: 'wallet', label: 'Ví credits', symbol: '🪙' },
    { key: 'account', label: 'Tài khoản', symbol: '👤' },
  ];

  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;

        if (tab.isAction) {
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.actionTabWrapper}
              onPress={() => onSelectTab(tab.key)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Xem bói chỉ tay"
            >
              <View style={[styles.actionBtn, isActive && styles.actionBtnActive]}>
                <Text style={styles.actionSymbol}>{tab.symbol}</Text>
                <View style={styles.actionStarBadge}>
                  <Text style={styles.actionStarText}>✦</Text>
                </View>
              </View>
              <Text style={[styles.actionLabel, isActive && styles.actionLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Text style={[styles.symbol, isActive && styles.symbolActive]}>
                {tab.symbol}
              </Text>
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
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
    backgroundColor: '#0d081b',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.22)',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabItemActive: {},
  iconWrap: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    transform: [{ scale: 1.1 }],
  },
  symbol: {
    fontSize: 19,
    opacity: 0.65,
  },
  symbolActive: {
    opacity: 1,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#9e8cb8',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#f7e7b4',
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 14,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#d4af37',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // Center Prominent Scan Action
  actionTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    paddingHorizontal: 6,
  },
  actionBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
  },
  actionBtnActive: {
    backgroundColor: '#d4af37',
    borderColor: '#fff3d1',
    shadowOpacity: 0.7,
    shadowRadius: 14,
  },
  actionSymbol: {
    fontSize: 24,
  },
  actionStarBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#2c1d4f',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  actionStarText: {
    fontSize: 9,
    color: '#f7e7b4',
    fontWeight: 'bold',
  },
  actionLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#d4af37',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  actionLabelActive: {
    color: '#fff3d1',
    fontWeight: '700',
  },
});

export default BottomNav;
