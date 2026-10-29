import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PALMSIGHT_MOBILE_THEME } from './src/theme/tokens';
import { MysticHeader } from './src/components/MysticHeader';
import { BottomNav, TabKey } from './src/components/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { SettingsModal } from './src/screens/SettingsModal';
import { getToken, getProfileApi, initApiUrl } from './src/services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Initialize API URL & Token on mount
  useEffect(() => {
    (async () => {
      await initApiUrl();
      const savedToken = await getToken();
      if (savedToken) {
        setToken(savedToken);
      }
    })();
  }, []);

  // Fetch profile when token changes or is updated
  const fetchProfile = useCallback(async () => {
    const currentToken = token || (await getToken());
    if (!currentToken) {
      setProfile(null);
      return;
    }
    try {
      const res = await getProfileApi(currentToken);
      setProfile(res.user || res);
    } catch {
      setProfile(null);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Mystic Navbar Header */}
      <MysticHeader
        creditBalance={profile?.creditBalance ?? null}
        isLogged={!!token}
        onOpenWallet={() => setActiveTab('wallet')}
        onOpenSettings={() => setSettingsVisible(true)}
        onGoHome={() => setActiveTab('home')}
      />

      {/* Screen Body */}
      <View style={styles.body}>
        {activeTab === 'home' && (
          <HomeScreen
            onStartReading={() => setActiveTab('scan')}
            onGoAccount={() => setActiveTab('account')}
            onGoReferral={() => setActiveTab('account')}
          />
        )}

        {activeTab === 'scan' && (
          <ScanScreen
            token={token}
            onRefreshProfile={fetchProfile}
            onGoHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            token={token}
            onGoScan={() => setActiveTab('scan')}
            onGoLogin={() => setActiveTab('account')}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletScreen
            token={token}
            creditBalance={profile?.creditBalance ?? 0}
            onGoReferral={() => setActiveTab('account')}
            onGoScan={() => setActiveTab('scan')}
            onGoLogin={() => setActiveTab('account')}
          />
        )}

        {activeTab === 'account' && (
          <AccountScreen
            token={token}
            onLoginSuccess={(newToken) => {
              setToken(newToken);
              fetchProfile();
            }}
            onLogout={() => {
              setToken(null);
              setProfile(null);
            }}
            onRefreshProfile={fetchProfile}
          />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
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
