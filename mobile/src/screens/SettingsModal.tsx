import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { TarotCard } from '../components/TarotCard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { getApiUrl, setApiUrl } from '../services/api';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [urlInput, setUrlInput] = useState(getApiUrl());
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    await setApiUrl(urlInput);
    setUrlInput(getApiUrl());
    Alert.alert('Đã lưu', `URL API hiện tại: ${getApiUrl()}`);
    onClose();
  };

  const handleTestPing = async () => {
    setTesting(true);
    try {
      const pingUrl = `${urlInput.replace(/\/+$/, '')}/health`;
      const res = await axios.get(pingUrl, { timeout: 6000 });
      if (res.data?.status === 'ok') {
        Alert.alert(
          'Kết nối thành công! 🎉',
          `Máy chủ phản hồi OK.\nTrạng thái Database: ${res.data.database || 'connected'}`
        );
      } else {
        Alert.alert('Máy chủ phản hồi', JSON.stringify(res.data));
      }
    } catch (err: any) {
      Alert.alert(
        'Không thể kết nối',
        `Lỗi: ${err.message}\nHãy kiểm tra:\n1. Backend NestJS có đang chạy không (cổng 4000).\n2. Điện thoại và máy tính có chung mạng Wi-Fi không.`
      );
    } finally {
      setTesting(false);
    }
  };

  const handleSetDefaultIp = () => {
    setUrlInput('http://192.168.88.165:4000/api/v1');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TarotCard style={styles.modalCard}>
          <Text style={styles.badgeTop}>✦ THIẾT LẬP MÁY CHỦ API</Text>
          <Text style={styles.modalTitle}>Cấu Hình Máy Chủ</Text>
          <Text style={styles.modalDesc}>
            Nhập URL Backend NestJS. Khi test điện thoại thật qua Expo Go, hãy
            dùng địa chỉ IP máy tính trong mạng Wi-Fi hoặc liên kết ngrok.
          </Text>

          <TextInput
            style={styles.input}
            value={urlInput}
            onChangeText={setUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.btnShortcut}
            onPress={handleSetDefaultIp}
          >
            <Text style={styles.btnShortcutText}>
              💡 Gán IP máy hiện tại: 192.168.88.165:4000
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSecondary, testing && styles.btnDisabled]}
            onPress={handleTestPing}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color={PALMSIGHT_MOBILE_THEME.colors.goldLight} />
            ) : (
              <Text style={styles.btnSecondaryText}>⚡ Kiểm Tra Kết Nối (Ping)</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
            <Text style={styles.btnPrimaryText}>LƯU CẤU HÌNH</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnClose} onPress={onClose}>
            <Text style={styles.btnCloseText}>Đóng</Text>
          </TouchableOpacity>
        </TarotCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 7, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    padding: 22,
  },
  badgeTop: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 13,
    marginBottom: 10,
  },
  btnShortcut: {
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  btnShortcutText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    paddingVertical: 12,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnSecondaryText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '700',
    fontSize: 13,
  },
  btnPrimary: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    paddingVertical: 13,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnPrimaryText: {
    color: PALMSIGHT_MOBILE_THEME.colors.canvas,
    fontWeight: '800',
    fontSize: 13,
  },
  btnClose: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnCloseText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 13,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
