import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../../theme/tokens';

export const TarotCorners: React.FC = () => {
  return (
    <>
      <View style={[styles.corner, styles.cornerTL]}>
        <Text style={styles.cornerText}>✦</Text>
      </View>
      <View style={[styles.corner, styles.cornerTR]}>
        <Text style={styles.cornerText}>✦</Text>
      </View>
      <View style={[styles.corner, styles.cornerBL]}>
        <Text style={styles.cornerText}>✦</Text>
      </View>
      <View style={[styles.corner, styles.cornerBR]}>
        <Text style={styles.cornerText}>✦</Text>
      </View>
    </>
  );
};

interface MysticDividerProps {
  label?: string;
}

export const MysticDivider: React.FC<MysticDividerProps> = ({ label }) => {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerSymbol}>✦ {label ? label.toUpperCase() : ''} ✦</Text>
      <View style={styles.dividerLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cornerTL: { top: 4, left: 6 },
  cornerTR: { top: 4, right: 6 },
  cornerBL: { bottom: 4, left: 6 },
  cornerBR: { bottom: 4, right: 6 },
  cornerText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldDim,
    fontSize: 9,
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
  },
  dividerSymbol: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 12,
  },
});
