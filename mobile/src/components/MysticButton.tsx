import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';

export type MysticButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type MysticButtonSize = 'sm' | 'md' | 'lg';

interface MysticButtonProps {
  title: string;
  onPress: () => void;
  variant?: MysticButtonVariant;
  size?: MysticButtonSize;
  icon?: string | React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  fullWidth?: boolean;
}

export const MysticButton: React.FC<MysticButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getContainerStyle = () => {
    const list: (ViewStyle | false | undefined)[] = [styles.base];

    if (fullWidth) list.push(styles.fullWidth);

    switch (size) {
      case 'sm':
        list.push(styles.sizeSm);
        break;
      case 'lg':
        list.push(styles.sizeLg);
        break;
      default:
        list.push(styles.sizeMd);
        break;
    }

    switch (variant) {
      case 'secondary':
        list.push(styles.secondary);
        break;
      case 'outline':
        list.push(styles.outline);
        break;
      case 'ghost':
        list.push(styles.ghost);
        break;
      case 'danger':
        list.push(styles.danger);
        break;
      default:
        list.push(styles.primary);
        break;
    }

    if (disabled) list.push(styles.disabled);

    return list;
  };

  const getTextStyle = () => {
    const list: (TextStyle | false | undefined)[] = [styles.baseText];

    switch (size) {
      case 'sm':
        list.push(styles.textSm);
        break;
      case 'lg':
        list.push(styles.textLg);
        break;
      default:
        list.push(styles.textMd);
        break;
    }

    switch (variant) {
      case 'secondary':
        list.push(styles.textSecondary);
        break;
      case 'outline':
        list.push(styles.textOutline);
        break;
      case 'ghost':
        list.push(styles.textGhost);
        break;
      case 'danger':
        list.push(styles.textDanger);
        break;
      default:
        list.push(styles.textPrimary);
        break;
    }

    return list;
  };

  const spinnerColor =
    variant === 'primary'
      ? PALMSIGHT_MOBILE_THEME.colors.canvas
      : PALMSIGHT_MOBILE_THEME.colors.gold;

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>
              {typeof icon === 'string' ? (
                <Text style={styles.iconText}>{icon}</Text>
              ) : (
                icon
              )}
            </View>
          )}

          <Text style={[getTextStyle(), textStyle]}>{title}</Text>

          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>
              {typeof icon === 'string' ? (
                <Text style={styles.iconText}>{icon}</Text>
              ) : (
                icon
              )}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  iconText: {
    fontSize: 16,
  },

  // Sizes
  sizeSm: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    minHeight: 34,
  },
  sizeMd: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    minHeight: 46,
  },
  sizeLg: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    minHeight: 52,
  },

  // Variants
  primary: {
    backgroundColor: '#d4af37',
    borderWidth: 1,
    borderColor: 'rgba(255, 243, 209, 0.6)',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  secondary: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 2,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.danger,
  },
  disabled: {
    opacity: 0.45,
  },

  // Text
  baseText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 13,
  },
  textMd: {
    fontSize: 15,
  },
  textLg: {
    fontSize: 16,
    fontWeight: '700',
  },
  textPrimary: {
    color: PALMSIGHT_MOBILE_THEME.colors.canvas,
  },
  textSecondary: {
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
  },
  textOutline: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  textGhost: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
  },
  textDanger: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
  },
});

export default MysticButton;
