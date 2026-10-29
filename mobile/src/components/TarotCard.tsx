import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';

interface TarotCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  goldBorder?: boolean;
}

export const TarotCard: React.FC<TarotCardProps> = ({
  children,
  style,
  goldBorder = true,
}) => {
  return (
    <View
      style={[
        styles.card,
        goldBorder && styles.goldBorder,
        style,
      ]}
    >
      {/* 4 Mystic Tarot Corners */}
      <Text style={[styles.corner, styles.cornerTL]}>✦</Text>
      <Text style={[styles.corner, styles.cornerTR]}>✦</Text>
      <Text style={[styles.corner, styles.cornerBL]}>✦</Text>
      <Text style={[styles.corner, styles.cornerBR]}>✦</Text>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.lg,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
  },
  goldBorder: {
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    shadowColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  corner: {
    position: 'absolute',
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 10,
    opacity: 0.8,
  },
  cornerTL: {
    top: 6,
    left: 8,
  },
  cornerTR: {
    top: 6,
    right: 8,
  },
  cornerBL: {
    bottom: 6,
    left: 8,
  },
  cornerBR: {
    bottom: 6,
    right: 8,
  },
});
