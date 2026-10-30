import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { APP_PACKAGE_NAME } from '../consts/common';
import { showSuccess, showError } from '../helpers/toast';

interface GoogleConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onTryDirectAuth: () => void;
  onSubmitManualToken?: (idToken: string) => Promise<void>;
  platform?: 'android' | 'ios' | 'web';
}

export const GoogleConfigModal: React.FC<GoogleConfigModalProps> = ({
  visible,
  onClose,
  onTryDirectAuth,
  onSubmitManualToken,
  platform = 'android',
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [submittingToken, setSubmittingToken] = useState(false);

  const handleCopy = async (key: string, text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedKey(key);
      showSuccess('Đã sao chép vào bộ nhớ tạm', 'Thành công');
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      showError('Không thể sao chép tự động', 'Lỗi');
    }
  };

  const handleManualSubmit = async () => {
    if (!manualToken.trim()) {
      showError('Vui lòng dán ID Token hợp lệ từ Google', 'Thiếu dữ liệu');
      return;
    }
    setSubmittingToken(true);
    try {
      if (onSubmitManualToken) {
        await onSubmitManualToken(manualToken.trim());
        onClose();
      }
    } catch (err: any) {
      showError(err?.message || 'Xác thực ID Token thất bại', 'Lỗi');
    } finally {
      setSubmittingToken(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>✦ CẤU HÌNH GOOGLE OAUTH ✦</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Warning Box */}
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>⚠️ Vì sao xuất hiện &quot;Lỗi ủy quyền&quot; (400: invalid_request)?</Text>
              <Text style={styles.warningText}>
                Google OAuth 2.0 phân biệt nghiêm ngặt giữa <Text style={styles.bold}>Web Client ID</Text> và{' '}
                <Text style={styles.bold}>Native Mobile Client ID</Text>. Google tuyệt đối không cho phép
                dùng Web Client ID với lược đồ ứng dụng di động (custom scheme như <Text style={styles.code}>palmsight://</Text>).
              </Text>
            </View>

            {/* Steps */}
            <Text style={styles.sectionTitle}>3 Bước Cấu Hình Nhanh Trên Google Cloud</Text>

            {/* Step 1 */}
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>1</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Tạo Client ID cho {platform === 'ios' ? 'iOS' : 'Android'}</Text>
                <Text style={styles.stepDesc}>
                  Truy cập Google Cloud Console &gt; <Text style={styles.bold}>APIs &amp; Services</Text> &gt;{' '}
                  <Text style={styles.bold}>Credentials</Text> &gt; <Text style={styles.bold}>+ Create Credentials</Text> &gt;{' '}
                  <Text style={styles.bold}>OAuth client ID</Text>.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>2</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Điền thông tin định danh ứng dụng</Text>
                <Text style={styles.stepDesc}>
                  {platform === 'ios' ? 'iOS Bundle ID:' : 'Package Name (Tên gói):'}
                </Text>

                <View style={styles.codeRow}>
                  <Text style={styles.codeValue}>{APP_PACKAGE_NAME}</Text>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => handleCopy('pkg', APP_PACKAGE_NAME)}
                  >
                    <Text style={styles.copyBtnText}>
                      {copiedKey === 'pkg' ? '✓ Đã chép' : 'Sao chép'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {platform === 'android' && (
                  <Text style={styles.stepHint}>
                    * SHA-1 fingerprint: Lấy bằng lệnh{' '}
                    <Text style={styles.code}>cd android &amp;&amp; ./gradlew signingReport</Text> hoặc mã debug
                    keystore Expo mặc định.
                  </Text>
                )}
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>3</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Lưu vào file .env của Mobile</Text>
                <Text style={styles.stepDesc}>Dán Client ID mới tạo vào biến:</Text>
                <View style={styles.codeRow}>
                  <Text style={styles.codeValue}>
                    {platform === 'ios'
                      ? 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
                      : 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'}
                  </Text>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() =>
                      handleCopy(
                        'envKey',
                        platform === 'ios'
                          ? 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
                          : 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'
                      )
                    }
                  >
                    <Text style={styles.copyBtnText}>
                      {copiedKey === 'envKey' ? '✓ Đã chép' : 'Sao chép'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Dev Mode Section */}
            <View style={styles.devBox}>
              <Text style={styles.devTitle}>🛠️ Dành cho Kiểm Thử &amp; Phát Triển (Dev Mode)</Text>
              <Text style={styles.devDesc}>
                Nếu bạn có sẵn Google ID Token (ví dụ từ frontend web hoặc Google OAuth Playground), bạn có thể
                dán vào đây để kiểm thử luồng đăng nhập ngay:
              </Text>
              <TextInput
                style={styles.tokenInput}
                placeholder="Dán Google ID Token tại đây..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={manualToken}
                onChangeText={setManualToken}
                multiline
                numberOfLines={2}
              />
              <TouchableOpacity
                style={[styles.actionBtn, styles.testAuthBtn]}
                onPress={handleManualSubmit}
                disabled={submittingToken}
              >
                {submittingToken ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.testAuthBtnText}>Đăng Nhập Với ID Token Này</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Try Anyway Button */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.forceBtn]}
              onPress={() => {
                onClose();
                onTryDirectAuth();
              }}
            >
              <Text style={styles.forceBtnText}>Thử Mở Trình Duyệt Ngay (Bỏ Qua Cảnh Báo)</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer Close */}
          <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
            <Text style={styles.closeFooterText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#120f24',
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.lg,
    padding: 18,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  headerTitle: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  closeBtn: {
    color: '#aaa',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scroll: {
    marginVertical: 4,
  },
  warningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  warningText: {
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: '#fff',
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#facc15',
  },
  sectionTitle: {
    color: '#d4af37',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d4af37',
    color: '#120f24',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 13,
    fontWeight: '800',
    marginRight: 10,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 17,
  },
  stepHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090813',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 6,
  },
  codeValue: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#38bdf8',
  },
  copyBtn: {
    backgroundColor: '#272042',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 6,
  },
  copyBtnText: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '700',
  },
  devBox: {
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  devTitle: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  devDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  tokenInput: {
    backgroundColor: '#090813',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    color: '#fff',
    fontSize: 11,
    padding: 8,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  actionBtn: {
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testAuthBtn: {
    backgroundColor: '#0284c7',
  },
  testAuthBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  forceBtn: {
    borderColor: 'rgba(212, 175, 55, 0.5)',
    borderWidth: 1,
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  forceBtnText: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '600',
  },
  closeFooterBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 6,
  },
  closeFooterText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default GoogleConfigModal;
