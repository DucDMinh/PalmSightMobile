import { Alert } from 'react-native';

export function showSuccess(message: string, title = 'Thành công') {
  Alert.alert(`✨ ${title}`, message);
}

export function showError(message: string, title = 'Thông báo lỗi') {
  Alert.alert(`⚠️ ${title}`, message);
}

export function showInfo(message: string, title = 'Thông báo') {
  Alert.alert(`ℹ️ ${title}`, message);
}

export default {
  showSuccess,
  showError,
  showInfo,
};
