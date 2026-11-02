import React, { useState } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import accountService from '../services/accountService';
import { showError, showSuccess } from '../helpers/toast';
import { MysticButton } from '../components/MysticButton';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword) {
      showError('Vui lòng nhập mật khẩu hiện tại.', 'Thông báo');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showError('Mật khẩu mới phải có ít nhất 8 ký tự.', 'Thông báo');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Xác nhận mật khẩu mới không khớp.', 'Thông báo');
      return;
    }

    setSubmitting(true);
    try {
      await accountService.changePassword({
        currentPassword,
        newPassword,
      });
      showSuccess('Đổi mật khẩu thành công!', 'Bảo mật');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.';
      showError(msg, 'Đổi mật khẩu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          <TarotCard style={styles.card}>
            <View style={styles.grabHandle} />

            <View style={styles.headerRow}>
              <View>
                <Text style={styles.badgeTop}>✦ BẢO MẬT TÀI KHOẢN ✦</Text>
                <Text style={styles.title}>Đổi Mật Khẩu</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Mật khẩu hiện tại</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor="#7e6d99"
              secureTextEntry
            />

            <Text style={styles.label}>Mật khẩu mới (tối thiểu 8 ký tự)</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor="#7e6d99"
              secureTextEntry
            />

            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#7e6d99"
              secureTextEntry
            />

            <MysticButton
              title="Cập Nhật Mật Khẩu"
              variant="primary"
              size="lg"
              onPress={handleSubmit}
              loading={submitting}
              fullWidth
              style={styles.submitBtn}
            />
          </TarotCard>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 10, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '88%',
    width: '100%',
  },
  card: {
    backgroundColor: '#1b1233',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.35)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badgeTop: {
    fontSize: 10,
    color: '#d4af37',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  closeBtnText: {
    color: '#9e8cb8',
    fontSize: 14,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#f5e6c8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f5e6c8',
    fontSize: 14,
    marginBottom: 14,
  },
  submitBtn: {
    marginTop: 6,
  },
});

export default ChangePasswordModal;
