import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../../theme/tokens';
export { TarotCorners } from '../TarotCard';

interface MysticDividerProps {
  label?: string;
  symbol?: string;
}

export const MysticDivider: React.FC<MysticDividerProps> = ({
  label,
  symbol = '✦ ☽ ☼ ☾ ✦',
}) => {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerSymbol}>
        {label ? `✦ ${label.toUpperCase()} ✦` : symbol}
      </Text>
      <View style={styles.dividerLine} />
    </View>
  );
};

const styles = StyleSheet.create({
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
    letterSpacing: 2.5,
    marginHorizontal: 12,
  },
});

export default MysticDivider;
