import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import GoogleLoginButton from './GoogleLoginButton';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import type { AuthResponseDto } from '@palmsight/shared';

interface SocialLoginButtonsProps {
  claimToken?: string | null;
  onSuccess?: (authData: AuthResponseDto) => void;
  showDivider?: boolean;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  claimToken,
  onSuccess,
  showDivider = true,
}) => {
  return (
    <View style={styles.container}>
      {showDivider && (
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>✦ HOẶC ✦</Text>
          <View style={styles.dividerLine} />
        </View>
      )}

      <GoogleLoginButton claimToken={claimToken} onSuccess={onSuccess} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
  },
  dividerText: {
    marginHorizontal: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.8,
  },
});

export default SocialLoginButtons;
