import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, LayoutChangeEvent } from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';

export const TarotCorners: React.FC = () => {
  return (
    <>
      <View style={[styles.cornerBracket, styles.cornerTL]} pointerEvents="none" />
      <View style={[styles.cornerBracket, styles.cornerTR]} pointerEvents="none" />
      <View style={[styles.cornerBracket, styles.cornerBL]} pointerEvents="none" />
      <View style={[styles.cornerBracket, styles.cornerBR]} pointerEvents="none" />
    </>
  );
};

interface TarotCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  onLayout?: (e: LayoutChangeEvent) => void;
}

export const TarotCard: React.FC<TarotCardProps> = ({
  children,
  style,
  interactive = false,
  onLayout,
}) => {
  return (
    <View style={[styles.card, interactive && styles.cardInteractive, style]} onLayout={onLayout}>
      <TarotCorners />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.lg,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    shadowColor: '#04020a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 4,
  },
  cardInteractive: {
    borderColor: 'rgba(212, 175, 55, 0.38)',
  },
  cornerBracket: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: 'rgba(212, 175, 55, 0.65)',
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  cornerTR: {
    top: 8,
    right: 8,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
  },
  cornerBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  cornerBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
});

export default TarotCard;
