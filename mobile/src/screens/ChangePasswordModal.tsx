import React, { useState } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import accountService from '../services/accountService';
import { showError, showSuccess } from '../helpers/toast';

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
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.badgeTop}>✦ BẢO MẬT TÀI KHOẢN</Text>
                <Text style={styles.title}>Đổi mật khẩu</Text>
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
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
              secureTextEntry
            />

            <Text style={styles.label}>Mật khẩu mới (ít nhất 8 ký tự)</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
              secureTextEntry
            />

            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.mute}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>CẬP NHẬT MẬT KHẨU</Text>
              )}
            </TouchableOpacity>
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
    maxHeight: '90%',
    width: '100%',
  },
  card: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badgeTop: {
    fontSize: 10,
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  closeBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: PALMSIGHT_MOBILE_THEME.colors.goldDim,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingHorizontal: 14,
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 15,
    marginBottom: 14,
  },
  submitBtn: {
    height: 48,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#120a21',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
  },
});

export default ChangePasswordModal;
