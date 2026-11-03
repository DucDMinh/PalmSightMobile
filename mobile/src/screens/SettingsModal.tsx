import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import { TarotCard } from '../components/TarotCard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { getApiUrl, setApiUrl } from '../services/api';
import { MysticButton } from '../components/MysticButton';

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
        `Lỗi: ${err.message}\nHãy kiểm tra:\n1. Backend NestJS có đang chạy không (cổng 4000).\n2. Thiết bị di động và máy tính có chung mạng Wi-Fi không.`
      );
    } finally {
      setTesting(false);
    }
  };

  const handleSetRender = () => {
    setUrlInput('https://palmsightmobile-1.onrender.com/api/v1');
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
          <Text style={styles.badgeTop}>✦ THIẾT LẬP MÁY CHỦ API ✦</Text>
          <Text style={styles.modalTitle}>Cấu Hình Máy Chủ</Text>
          <Text style={styles.modalDesc}>
            Nhập URL Backend NestJS. Mặc định kết nối Cloud Render hoặc địa chỉ máy tính khi dev.
          </Text>

          <TextInput
            style={styles.input}
            value={urlInput}
            onChangeText={setUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={{ gap: 6, marginVertical: 8 }}>
            <TouchableOpacity
              style={styles.btnShortcut}
              onPress={handleSetRender}
              activeOpacity={0.7}
            >
              <Text style={styles.btnShortcutText}>
                ☁️ Render Cloud: palmsightmobile-1.onrender.com
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnShortcut}
              onPress={handleSetDefaultIp}
              activeOpacity={0.7}
            >
              <Text style={styles.btnShortcutText}>
                💡 Gán IP máy tính: 192.168.88.165:4000
              </Text>
            </TouchableOpacity>
          </View>

          <MysticButton
            title="Kiểm tra kết nối (Ping)"
            icon="⚡"
            variant="secondary"
            size="md"
            onPress={handleTestPing}
            loading={testing}
            fullWidth
            style={{ marginBottom: 10 }}
          />

          <View style={styles.actionRow}>
            <MysticButton
              title="Đóng"
              variant="ghost"
              size="md"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <MysticButton
              title="Lưu cấu hình"
              variant="primary"
              size="md"
              onPress={handleSave}
              style={{ flex: 1.5 }}
            />
          </View>
        </TarotCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    padding: 22,
    backgroundColor: '#1b1233',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  badgeTop: {
    fontSize: 10,
    color: '#d4af37',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 12.5,
    color: '#9e8cb8',
    lineHeight: 18,
    marginBottom: 14,
  },
  input: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f5e6c8',
    fontSize: 13,
    marginBottom: 10,
  },
  btnShortcut: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  btnShortcutText: {
    fontSize: 11.5,
    color: '#d4af37',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});

export default SettingsModal;
