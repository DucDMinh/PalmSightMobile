import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TarotCard } from '../components/TarotCard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import {
  loginApi,
  registerApi,
  forgotPasswordApi,
  saveToken,
  clearToken,
  getProfileApi,
  changePasswordApi,
  getReferralsApi,
  enterReferralApi,
  describeApiError,
} from '../services/api';

interface AccountScreenProps {
  token: string | null;
  onLoginSuccess: (newToken: string) => void;
  onLogout: () => void;
  onRefreshProfile: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  token,
  onLoginSuccess,
  onLogout,
  onRefreshProfile,
}) => {
  // Auth state when not logged in
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Register inputs
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRefCode, setRegRefCode] = useState('');

  // Forgot password inputs
  const [forgotEmail, setForgotEmail] = useState('');

  // Logged-in profile state
  const [profile, setProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Referral state
  const [referralsData, setReferralsData] = useState<any | null>(null);
  const [enterRefCode, setEnterRefCode] = useState('');
  const [refLoading, setRefLoading] = useState(false);

  // Change password inputs
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  // Fetch full profile and referrals when logged in
  const loadAccountData = async () => {
    if (!token) return;
    setLoadingProfile(true);
    try {
      const [profData, refData] = await Promise.all([
        getProfileApi(token),
        getReferralsApi(token).catch(() => null),
      ]);
      setProfile(profData.user || profData);
      setReferralsData(refData);
    } catch (err: any) {
      console.warn('Lỗi tải thông tin tài khoản:', err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadAccountData();
  }, [token]);

  // Handle Login
  const handleLogin = async () => {
    if (!loginInput || !passwordInput) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên đăng nhập/email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginApi(loginInput.trim(), passwordInput);
      if (res.accessToken) {
        await saveToken(res.accessToken);
        onLoginSuccess(res.accessToken);
        Alert.alert('Thành công', 'Đăng nhập thành công!');
      }
    } catch (err: any) {
      const msg = describeApiError(err, 'Đăng nhập không thành công.');
      Alert.alert('Lỗi đăng nhập', msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async () => {
    if (!regDisplayName || !regUsername || !regEmail || !regPassword) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    if (regPassword.length < 8) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    setLoading(true);
    try {
      await registerApi({
        displayName: regDisplayName.trim(),
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        referralCode: regRefCode.trim().toUpperCase() || undefined,
      });
      Alert.alert(
        'Đăng ký thành công',
        'Vui lòng kiểm tra hộp thư email của bạn để bấm link xác thực kích hoạt 3 credits thưởng.'
      );
      setAuthMode('login');
      setLoginInput(regUsername);
    } catch (err: any) {
      const msg = describeApiError(err, 'Đăng ký không thành công.');
      Alert.alert('Lỗi đăng ký', msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email đã đăng ký.');
      return;
    }
    setLoading(true);
    try {
      await forgotPasswordApi(forgotEmail.trim().toLowerCase());
      Alert.alert(
        'Đã gửi liên kết',
        'Nếu email tồn tại trên hệ thống, chúng tôi đã gửi đường dẫn đặt lại mật khẩu.'
      );
      setAuthMode('login');
    } catch (err: any) {
      const msg = describeApiError(err, 'Không thể gửi yêu cầu đặt lại mật khẩu.');
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter Referral Code
  const handleEnterReferral = async () => {
    if (!enterRefCode || !token) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã giới thiệu 8 ký tự.');
      return;
    }
    setRefLoading(true);
    try {
      await enterReferralApi(enterRefCode.trim().toUpperCase(), token);
      Alert.alert('Thành công', 'Nhập mã giới thiệu thành công! Bạn nhận được +1 credit.');
      setEnterRefCode('');
      loadAccountData();
      onRefreshProfile();
    } catch (err: any) {
      const msg = describeApiError(err, 'Không thể áp dụng mã giới thiệu.');
      Alert.alert('Lỗi nhập mã', msg);
    } finally {
      setRefLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ các trường đổi mật khẩu.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Không khớp', 'Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }
    if (newPwd.length < 8) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    setPwdLoading(true);
    try {
      await changePasswordApi(currentPwd, newPwd, token!);
      Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: any) {
      const msg = describeApiError(err, 'Đổi mật khẩu thất bại.');
      Alert.alert('Lỗi', msg);
    } finally {
      setPwdLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await clearToken();
          onLogout();
        },
      },
    ]);
  };

  // NOT LOGGED IN VIEW
  if (!token) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.authModeTabs}>
          <TouchableOpacity
            style={[styles.authTab, authMode === 'login' && styles.authTabActive]}
            onPress={() => setAuthMode('login')}
          >
            <Text
              style={[styles.authTabText, authMode === 'login' && styles.authTabTextActive]}
            >
              Đăng Nhập
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authTab, authMode === 'register' && styles.authTabActive]}
            onPress={() => setAuthMode('register')}
          >
            <Text
              style={[
                styles.authTabText,
                authMode === 'register' && styles.authTabTextActive,
              ]}
            >
              Đăng Ký (+3 🪙)
            </Text>
          </TouchableOpacity>
        </View>

        {authMode === 'login' ? (
          /* Login Form */
          <TarotCard style={styles.formCard}>
            <Text style={styles.badgeTop}>✦ CỔNG HUYỀN MÔN</Text>
            <Text style={styles.formTitle}>Đăng Nhập</Text>
            <Text style={styles.formDesc}>
              Dùng email hoặc tên đăng nhập của bạn.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email hoặc Tên đăng nhập"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.ash}
              value={loginInput}
              onChangeText={setLoginInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.ash}
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
            />

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => setAuthMode('forgot')}
            >
              <Text style={styles.forgotBtnText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={PALMSIGHT_MOBILE_THEME.colors.canvas} />
              ) : (
                <Text style={styles.btnPrimaryText}>ĐĂNG NHẬP</Text>
              )}
            </TouchableOpacity>
          </TarotCard>
        ) : authMode === 'register' ? (
          /* Register Form */
          <TarotCard style={styles.formCard}>
            <Text style={styles.badgeTop}>✦ KHAI MỞ TÀI KHOẢN MỚI</Text>
            <Text style={styles.formTitle}>Đăng Ký Thành Viên</Text>
            <Text style={styles.formDesc}>
              Nhận ngay 3 credits miễn phí trải nghiệm bói chỉ tay.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Họ và tên hiển thị"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.ash}
              value={regDisplayName}
              onChangeText={setRegDisplayName}
            />

            <TextInput
              style={styles.input}
              placeholder="Tên đăng nhập (viết liền không dấu)"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.ash}
              value={regUsername}
              onChangeText={setRegUsername}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Địa chỉ Email"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.ash}
              value={regEmail}
              onChangeText={setRegEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Mật khẩu (ít nhất 8 ký tự)"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.ash}
              secureTextEntry
              value={regPassword}
              onChangeText={setRegPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Mã giới thiệu từ bạn bè (nếu có)"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.ash}
              value={regRefCode}
              onChangeText={setRegRefCode}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={PALMSIGHT_MOBILE_THEME.colors.canvas} />
              ) : (
                <Text style={styles.btnPrimaryText}>ĐĂNG KÝ VÀ NHẬN 3 CREDITS</Text>
              )}
            </TouchableOpacity>
          </TarotCard>
        ) : (
          /* Forgot Password Form */
          <TarotCard style={styles.formCard}>
            <Text style={styles.badgeTop}>✦ LẤY LẠI MẬT KHẨU</Text>
            <Text style={styles.formTitle}>Quên Mật Khẩu</Text>
            <Text style={styles.formDesc}>
              Nhập email đăng ký để nhận liên kết đặt lại mật khẩu.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email của bạn"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.ash}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={PALMSIGHT_MOBILE_THEME.colors.canvas} />
              ) : (
                <Text style={styles.btnPrimaryText}>GỬI LIÊN KẾT ĐẶT LẠI</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLoginBtn}
              onPress={() => setAuthMode('login')}
            >
              <Text style={styles.backToLoginText}>&larr; Quay lại Đăng nhập</Text>
            </TouchableOpacity>
          </TarotCard>
        )}
      </ScrollView>
    );
  }

  // LOGGED IN VIEW
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loadingProfile ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={PALMSIGHT_MOBILE_THEME.colors.gold} />
          <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
        </View>
      ) : (
        <View>
          {/* Profile Card */}
          <TarotCard style={styles.profileCard}>
            <Text style={styles.badgeTop}>✦ HỒ SƠ THIÊN MỆNH</Text>
            <Text style={styles.profileName}>
              {profile?.displayName || 'Người dùng'}
            </Text>
            <Text style={styles.profileSub}>
              @{profile?.username || 'user'} • {profile?.email || 'N/A'}
            </Text>

            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.balanceLabel}>Số Dư Credits</Text>
                <Text style={styles.balanceVal}>
                  {profile?.creditBalance ?? 0} Credits
                </Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Đã Xác Thực</Text>
              </View>
            </View>
          </TarotCard>

          {/* Referral Card (Kết duyên tri kỷ) */}
          <TarotCard style={styles.refShareCard}>
            <Text style={styles.badgeTop}>✦ KẾT DUYÊN TRI KỶ</Text>
            <Text style={styles.refTitle}>Mã Giới Thiệu Của Bạn</Text>
            <Text style={styles.refDesc}>
              Chia sẻ mã này với bạn bè. Bạn nhận +2 credits ngay khi họ nhập mã;
              bạn bè được +1 credit.
            </Text>

            <View style={styles.codeBox}>
              <Text style={styles.codeText}>
                {profile?.referralCode || 'CHƯA CÓ'}
              </Text>
            </View>

            <View style={styles.refStatsRow}>
              <View style={styles.refStat}>
                <Text style={styles.refStatVal}>
                  {referralsData?.totalRewarded ?? 0}
                </Text>
                <Text style={styles.refStatLabel}>Lượt Đã Mời</Text>
              </View>
              <View style={styles.refStat}>
                <Text style={styles.refStatVal}>
                  +{referralsData?.totalCreditsEarned ?? 0}
                </Text>
                <Text style={styles.refStatLabel}>Credits Đã Nhận</Text>
              </View>
            </View>
          </TarotCard>

          {/* Enter Referral Code (If user hasn't entered one) */}
          {profile?.referral?.canEnterCode && (
            <TarotCard style={styles.enterRefCard}>
              <Text style={styles.badgeTop}>✦ NHẬP MÃ BẠN BÈ (+1 CREDIT)</Text>
              <Text style={styles.enterRefTitle}>Nhập Mã Giới Thiệu</Text>
              <Text style={styles.enterRefDesc}>
                Nhập mã 8 ký tự từ bạn bè để được cộng ngay 1 credit vào số dư.
              </Text>

              <View style={styles.enterRefRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="Mã 8 ký tự"
                  placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.ash}
                  value={enterRefCode}
                  onChangeText={setEnterRefCode}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <TouchableOpacity
                  style={[styles.btnPrimary, styles.btnCompact, refLoading && styles.btnDisabled]}
                  onPress={handleEnterReferral}
                  disabled={refLoading}
                >
                  <Text style={styles.btnPrimaryText}>Áp Dụng</Text>
                </TouchableOpacity>
              </View>
            </TarotCard>
          )}

          {/* Change Password Card */}
          <TarotCard style={styles.pwdCard}>
            <Text style={styles.badgeTop}>✦ BẢO MẬT TÀI KHOẢN</Text>
            <Text style={styles.pwdTitle}>Đổi Mật Khẩu</Text>

            <TextInput
              style={styles.input}
              placeholder="Mật khẩu hiện tại"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.ash}
              secureTextEntry
              value={currentPwd}
              onChangeText={setCurrentPwd}
            />

            <TextInput
              style={styles.input}
              placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.ash}
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
            />

            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu mới"
              placeholderTextColor={PALMSIGHT_MOBILE_THEME.colors.ash}
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
            />

            <TouchableOpacity
              style={[styles.btnPrimary, pwdLoading && styles.btnDisabled]}
              onPress={handleChangePassword}
              disabled={pwdLoading}
            >
              {pwdLoading ? (
                <ActivityIndicator color={PALMSIGHT_MOBILE_THEME.colors.canvas} />
              ) : (
                <Text style={styles.btnPrimaryText}>CẬP NHẬT MẬT KHẨU</Text>
              )}
            </TouchableOpacity>
          </TarotCard>

          {/* Data Deletion Policy Notice */}
          <View style={styles.dataPolicyBox}>
            <Text style={styles.dataPolicyTitle}>🛡️ Xoá Dữ Liệu & Quyền Riêng Tư</Text>
            <Text style={styles.dataPolicyText}>
              Theo chính sách bảo mật (ADR-0009), ứng dụng không có nút tự xoá tài
              khoản để ngăn chặn farm credits. Nếu bạn muốn xoá vĩnh viễn dữ liệu
              và tài khoản, vui lòng gửi email yêu cầu về bộ phận hỗ trợ PalmSight.
            </Text>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
            <Text style={styles.btnLogoutText}>🚪 Đăng Xuất Tài Khoản</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  authModeTabs: {
    flexDirection: 'row',
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceSoft,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
  },
  authTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
  },
  authTabActive: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
  },
  authTabText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 13,
    fontWeight: '600',
  },
  authTabTextActive: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '800',
  },
  formCard: {
    padding: 22,
  },
  badgeTop: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 4,
  },
  formDesc: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    marginBottom: 18,
  },
  input: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 14,
    marginBottom: 12,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    paddingVertical: 14,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    shadowColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: PALMSIGHT_MOBILE_THEME.colors.canvas,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  backToLoginBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  backToLoginText: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 13,
  },
  profileCard: {
    padding: 20,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginTop: 4,
  },
  profileSub: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    marginTop: 2,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceSoft,
    padding: 14,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
  },
  balanceLabel: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
  },
  balanceVal: {
    fontSize: 18,
    fontWeight: '900',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: PALMSIGHT_MOBILE_THEME.colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  refShareCard: {
    padding: 20,
    marginBottom: 16,
  },
  refTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 4,
  },
  refDesc: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    lineHeight: 18,
    marginBottom: 14,
  },
  codeBox: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '900',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    letterSpacing: 4,
  },
  refStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  refStat: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceSoft,
    padding: 12,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    alignItems: 'center',
  },
  refStatVal: {
    fontSize: 18,
    fontWeight: '900',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  refStatLabel: {
    fontSize: 10,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    marginTop: 2,
  },
  enterRefCard: {
    padding: 20,
    marginBottom: 16,
  },
  enterRefTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 4,
  },
  enterRefDesc: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    marginBottom: 12,
  },
  enterRefRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputFlex: {
    flex: 1,
    marginBottom: 0,
  },
  btnCompact: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  pwdCard: {
    padding: 20,
    marginBottom: 16,
  },
  pwdTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 12,
  },
  dataPolicyBox: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceSoft,
    padding: 14,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.borderSubtle,
    marginBottom: 16,
  },
  dataPolicyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 4,
  },
  dataPolicyText: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.ash,
    lineHeight: 16,
  },
  btnLogout: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.danger,
    paddingVertical: 14,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnLogoutText: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
    fontWeight: '800',
    fontSize: 13,
  },
});
