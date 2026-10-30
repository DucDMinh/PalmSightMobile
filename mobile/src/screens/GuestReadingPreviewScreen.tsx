import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import readingsService from '../services/readingsService';
import { formatCountdown } from '../helpers/timer';
import { useAuth } from '../providers/AuthenticationProvider';
import {
  GuestReadingPreviewDto,
  READING_SCHOOLS,
  HandOrientation,
} from '@palmsight/shared';

interface GuestReadingPreviewScreenProps {
  claimToken: string;
  onBack: () => void;
  onRegisterToUnlock: (claimToken: string) => void;
}

export const GuestReadingPreviewScreen: React.FC<GuestReadingPreviewScreenProps> = ({
  claimToken,
  onBack,
  onRegisterToUnlock,
}) => {
  const [preview, setPreview] = useState<GuestReadingPreviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdownText, setCountdownText] = useState('');
  const { setClaimToken } = useAuth();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setClaimToken(claimToken);

    readingsService
      .getGuestReadingPreview(claimToken)
      .then((data) => {
        if (mounted) setPreview(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [claimToken, setClaimToken]);

  // Expiration countdown
  useEffect(() => {
    if (!preview?.previewExpiresAt) return;
    const updateCountdown = () => {
      const countdown = formatCountdown(preview.previewExpiresAt);
      setCountdownText(countdown.formatted);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [preview?.previewExpiresAt]);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={PALMSIGHT_MOBILE_THEME.colors.gold} />
        <Text style={styles.loadingText}>Đang chuẩn bị bản xem thử quẻ bói...</Text>
      </View>
    );
  }

  if (!preview) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorTitle}>[!] KHÔNG TÌM THẤY BẢN XEM TRƯỚC</Text>
        <Text style={styles.errorDesc}>
          Bài bói thử đã hết hạn (lưu trữ 7 ngày) hoặc không tồn tại trên hệ thống.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>&larr; Bói quẻ mới</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const schoolConfig = READING_SCHOOLS[preview.school];
  const schoolName = schoolConfig?.name || preview.school;
  const handName = preview.hand === HandOrientation.RIGHT ? 'Tay Phải' : 'Tay Trái';

  return (
    <View style={styles.screenWrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top bar back */}
        <TouchableOpacity style={styles.backArrowBtn} onPress={onBack}>
          <Text style={styles.backArrowText}>&larr; Quay lại</Text>
        </TouchableOpacity>

        {/* Countdown Banner */}
        <View style={styles.countdownBanner}>
          <Text style={styles.countdownTitle}>⏳ BẢN XEM THỬ MIỄN PHÍ</Text>
          <Text style={styles.countdownText}>
            Hết hạn sau: <Text style={styles.countdownHighlight}>{countdownText}</Text>
          </Text>
        </View>

        {/* Preview Card */}
        <TarotCard style={styles.card}>
          <View style={styles.metaRow}>
            <View style={styles.badgeSchool}>
              <Text style={styles.badgeSchoolText}>✦ {schoolName}</Text>
            </View>
            <View style={styles.badgeHand}>
              <Text style={styles.badgeHandText}>{handName}</Text>
            </View>
          </View>

          <Text style={styles.readingTitle}>Bản Xem Thử Luận Giải Chỉ Tay</Text>
          <Text style={styles.previewNote}>
            Phiên bản xem thử mở khóa 50% nội dung cơ bản. Đăng ký để đọc toàn bộ luận giải chuyên sâu!
          </Text>

          {preview.imageUrl && (
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: preview.imageUrl }}
                style={styles.palmImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Unlocked Summary */}
          {preview.summary && (
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>🌟 Tổng Quan Vận Mệnh</Text>
              <Text style={styles.bodyText}>{preview.summary}</Text>
            </View>
          )}

          {/* Sections list with locks */}
          <Text style={styles.groupHeader}>📜 Các Đường Chỉ Tay</Text>
          {preview.sections?.map((sec, idx) => {
            const isLocked = sec.isLocked;
            return (
              <View
                key={sec.key || idx}
                style={[styles.itemCard, isLocked && styles.itemCardLocked]}
              >
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>🔹 {sec.title || sec.key}</Text>
                  {isLocked && <Text style={styles.lockBadge}>🔒 Bị khóa</Text>}
                </View>

                {isLocked ? (
                  <View style={styles.lockedPlaceholder}>
                    <Text style={styles.lockedText}>
                      Đăng ký tài khoản miễn phí để mở khóa quan sát đặc trưng & luận giải chi tiết cung này.
                    </Text>
                  </View>
                ) : (
                  <View>
                    {sec.observation && (
                      <View style={styles.subItemRow}>
                        <Text style={styles.subItemLabel}>Quan sát:</Text>
                        <Text style={styles.bodyText}>{sec.observation}</Text>
                      </View>
                    )}
                    {sec.meaning && (
                      <View style={styles.subItemRow}>
                        <Text style={styles.subItemLabel}>Ý nghĩa:</Text>
                        <Text style={styles.bodyTextHighlight}>{sec.meaning}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {/* Aspects with locks */}
          <Text style={styles.groupHeader}>✨ 6 Khía Cạnh Cuộc Sống</Text>
          {preview.aspects &&
            Object.entries(preview.aspects).map(([key, val]: any) => (
              <View key={key} style={[styles.itemCard, styles.itemCardLocked]}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>◆ {val?.title || key.toUpperCase()}</Text>
                  <Text style={styles.lockBadge}>🔒 Bị khóa</Text>
                </View>
                <Text style={styles.lockedText}>
                  Luận giải vận hạn, tình duyên và sự nghiệp chi tiết đang chờ bạn mở khóa.
                </Text>
              </View>
            ))}
        </TarotCard>
      </ScrollView>

      {/* Sticky Unlock Bar */}
      <View style={styles.stickyUnlockContainer}>
        <View style={styles.stickyUnlockCard}>
          <Text style={styles.stickyUnlockTitle}>
            🔓 MỞ KHÓA 100% BÀI BÓI CHI TIẾT
          </Text>
          <Text style={styles.stickyUnlockDesc}>
            Đăng ký tài khoản miễn phí để lưu quẻ vĩnh viễn và nhận thêm credits bói mới!
          </Text>
          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={() => onRegisterToUnlock(claimToken)}
            activeOpacity={0.85}
          >
            <Text style={styles.unlockBtnText}>[ ĐĂNG KÝ MỞ KHÓA NGAY ]</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
  },
  container: {
    padding: 16,
    paddingBottom: 160,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
  },
  loadingText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
  },
  backBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: 'bold',
  },
  backArrowBtn: {
    paddingVertical: 6,
    marginBottom: 10,
  },
  backArrowText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 14,
    fontWeight: '700',
  },
  countdownBanner: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  countdownTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  countdownText: {
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 13,
  },
  countdownHighlight: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    padding: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  badgeSchool: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
  },
  badgeSchoolText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeHand: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
  },
  badgeHandText: {
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 11,
  },
  readingTitle: {
    fontSize: 22,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 6,
  },
  previewNote: {
    fontSize: 13,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    lineHeight: 18,
    marginBottom: 16,
  },
  imageWrap: {
    width: '100%',
    height: 220,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    overflow: 'hidden',
    marginBottom: 16,
  },
  palmImage: {
    width: '100%',
    height: '100%',
  },
  sectionBox: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 14,
    marginBottom: 16,
  },
  sectionHeader: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  groupHeader: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 16,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 14,
    marginBottom: 10,
  },
  itemCardLocked: {
    opacity: 0.85,
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  lockBadge: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.warning,
    fontWeight: '700',
  },
  lockedPlaceholder: {
    paddingVertical: 6,
  },
  lockedText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  subItemRow: {
    marginTop: 4,
  },
  subItemLabel: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bodyText: {
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 14,
    lineHeight: 22,
  },
  bodyTextHighlight: {
    color: PALMSIGHT_MOBILE_THEME.colors.inkDeep,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  stickyUnlockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(11, 7, 22, 0.95)',
    borderTopWidth: 1,
    borderTopColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
  },
  stickyUnlockCard: {
    alignItems: 'center',
  },
  stickyUnlockTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stickyUnlockDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
  },
  unlockBtn: {
    width: '100%',
    height: 46,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  unlockBtnText: {
    color: '#120a21',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
  },
});

export default GuestReadingPreviewScreen;
