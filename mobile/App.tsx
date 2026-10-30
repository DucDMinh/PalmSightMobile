import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { PALMSIGHT_MOBILE_THEME } from './src/theme/tokens';

WebBrowser.maybeCompleteAuthSession();
import { AuthenticationProvider, useAuth } from './src/providers/AuthenticationProvider';
import { MysticHeader } from './src/components/MysticHeader';
import { BottomNav, TabKey } from './src/components/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { ReadingDetailScreen } from './src/screens/ReadingDetailScreen';
import { GuestReadingPreviewScreen } from './src/screens/GuestReadingPreviewScreen';
import { SettingsModal } from './src/screens/SettingsModal';
import { LoginModal } from './src/screens/LoginModal';
import { RegisterModal } from './src/screens/RegisterModal';
import { ForgotPasswordModal } from './src/screens/ForgotPasswordModal';
import { ChangePasswordModal } from './src/screens/ChangePasswordModal';
import type { ReadingDto } from '@palmsight/shared';

function AppContent() {
  const { user, isLogged } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [selectedReading, setSelectedReading] = useState<ReadingDto | null>(null);
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);
  const [activeGuestClaimToken, setActiveGuestClaimToken] = useState<string | null>(null);

  // Modals
  const [loginVisible, setLoginVisible] = useState(false);
  const [registerVisible, setRegisterVisible] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [initialReferralCode, setInitialReferralCode] = useState('');

  const clearSubScreens = () => {
    setSelectedReading(null);
    setSelectedReadingId(null);
    setActiveGuestClaimToken(null);
  };

  const handleSelectTab = (tab: TabKey) => {
    clearSubScreens();
    setActiveTab(tab);
  };

  const handleOpenRegisterWithCode = (code = '') => {
    setInitialReferralCode(code);
    setLoginVisible(false);
    setForgotPasswordVisible(false);
    setRegisterVisible(true);
  };

  const handleOpenLogin = () => {
    setRegisterVisible(false);
    setForgotPasswordVisible(false);
    setLoginVisible(true);
  };

  const handleOpenForgotPassword = () => {
    setLoginVisible(false);
    setRegisterVisible(false);
    setForgotPasswordVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header */}
      <MysticHeader
        creditBalance={user?.creditBalance ?? null}
        isLogged={isLogged}
        onOpenWallet={() => handleSelectTab('wallet')}
        onOpenSettings={() => setSettingsVisible(true)}
        onGoHome={() => handleSelectTab('home')}
      />

      {/* Main View Area */}
      <View style={styles.body}>
        {selectedReading || selectedReadingId ? (
          <ReadingDetailScreen
            readingId={selectedReadingId}
            initialReading={selectedReading}
            onBack={clearSubScreens}
            onDeleted={clearSubScreens}
          />
        ) : activeGuestClaimToken ? (
          <GuestReadingPreviewScreen
            claimToken={activeGuestClaimToken}
            onBack={clearSubScreens}
            onRegisterToUnlock={(token) => {
              handleOpenRegisterWithCode();
            }}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                onStartReading={() => handleSelectTab('scan')}
                onGoAccount={() => handleSelectTab('account')}
                onGoReferral={() => handleSelectTab('account')}
              />
            )}

            {activeTab === 'scan' && (
              <ScanScreen
                onGoHistory={() => handleSelectTab('history')}
                onGoWallet={() => handleSelectTab('wallet')}
                onGoReadingDetail={(reading) => setSelectedReading(reading)}
                onGoGuestPreview={(claimToken) => setActiveGuestClaimToken(claimToken)}
              />
            )}

            {activeTab === 'history' && (
              <HistoryScreen
                onGoScan={() => handleSelectTab('scan')}
                onGoLogin={handleOpenLogin}
                onSelectReading={(id) => setSelectedReadingId(id)}
              />
            )}

            {activeTab === 'wallet' && (
              <WalletScreen
                onGoScan={() => handleSelectTab('scan')}
                onGoAccount={() => handleSelectTab('account')}
                onGoLogin={handleOpenLogin}
              />
            )}

            {activeTab === 'account' && (
              <AccountScreen
                onGoWallet={() => handleSelectTab('wallet')}
                onGoLogin={handleOpenLogin}
                onGoChangePassword={() => setChangePasswordVisible(true)}
              />
            )}
          </>
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />

      {/* Modals */}
      <LoginModal
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onGoRegister={handleOpenRegisterWithCode}
        onGoForgotPassword={handleOpenForgotPassword}
      />

      <RegisterModal
        visible={registerVisible}
        initialReferralCode={initialReferralCode}
        onClose={() => setRegisterVisible(false)}
        onGoLogin={handleOpenLogin}
      />

      <ForgotPasswordModal
        visible={forgotPasswordVisible}
        onClose={() => setForgotPasswordVisible(false)}
        onGoLogin={handleOpenLogin}
      />

      <ChangePasswordModal
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
      />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthenticationProvider>
      <AppContent />
    </AuthenticationProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
  },
  body: {
    flex: 1,
  },
});
