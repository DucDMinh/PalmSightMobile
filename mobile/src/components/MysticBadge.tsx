import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';

export type MysticBadgeVariant =
  | 'gold'
  | 'purple'
  | 'emerald'
  | 'rose'
  | 'mute'
  | 'cosmic';

interface MysticBadgeProps {
  label: string;
  icon?: string | React.ReactNode;
  variant?: MysticBadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export const MysticBadge: React.FC<MysticBadgeProps> = ({
  label,
  icon = '✦',
  variant = 'gold',
  size = 'md',
  style,
  textStyle,
}) => {
  const getContainerVariantStyle = () => {
    switch (variant) {
      case 'purple':
        return styles.purpleBadge;
      case 'emerald':
        return styles.emeraldBadge;
      case 'rose':
        return styles.roseBadge;
      case 'mute':
        return styles.muteBadge;
      case 'cosmic':
        return styles.cosmicBadge;
      default:
        return styles.goldBadge;
    }
  };

  const getTextVariantStyle = () => {
    switch (variant) {
      case 'purple':
        return styles.purpleText;
      case 'emerald':
        return styles.emeraldText;
      case 'rose':
        return styles.roseText;
      case 'mute':
        return styles.muteText;
      case 'cosmic':
        return styles.cosmicText;
      default:
        return styles.goldText;
    }
  };

  return (
    <View
      style={[
        styles.baseBadge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        getContainerVariantStyle(),
        style,
      ]}
    >
      {icon && (
        <View style={styles.iconWrap}>
          {typeof icon === 'string' ? (
            <Text style={[getTextVariantStyle(), styles.iconText]}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
      )}
      <Text
        style={[
          styles.baseText,
          size === 'sm' ? styles.textSm : styles.textMd,
          getTextVariantStyle(),
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  baseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeMd: {
    paddingVertical: 4,
    paddingHorizontal: 11,
  },
  iconWrap: {
    marginRight: 5,
  },
  iconText: {
    fontSize: 11,
    fontWeight: '700',
  },
  baseText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 12,
  },

  // Variants
  goldBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: 'rgba(212, 175, 55, 0.45)',
  },
  goldText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },

  purpleBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.45)',
  },
  purpleText: {
    color: '#d8b4fe',
  },

  emeraldBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.45)',
  },
  emeraldText: {
    color: '#6ee7b7',
  },

  roseBadge: {
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
    borderColor: 'rgba(251, 113, 133, 0.45)',
  },
  roseText: {
    color: '#fda4af',
  },

  muteBadge: {
    backgroundColor: 'rgba(158, 140, 184, 0.12)',
    borderColor: 'rgba(158, 140, 184, 0.3)',
  },
  muteText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
  },

  cosmicBadge: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  cosmicText: {
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
  },
});

export default MysticBadge;
