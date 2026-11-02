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
import { MysticButton } from '../components/MysticButton';
import { MysticBadge } from '../components/MysticBadge';

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
        <Text style={styles.errorTitle}>KHÔNG TÌM THẤY BẢN XEM TRƯỚC</Text>
        <Text style={styles.errorDesc}>
          Bài bói thử đã hết hạn (lưu trữ 7 ngày) hoặc không tồn tại trên hệ thống.
        </Text>
        <MysticButton title="← Khai quẻ mới" variant="primary" size="md" onPress={onBack} />
      </View>
    );
  }

  const schoolConfig = READING_SCHOOLS[preview.school];
  const schoolName = schoolConfig?.name || preview.school;
  const handName = preview.hand === HandOrientation.RIGHT ? 'Tay Phải' : 'Tay Trái';

  return (
    <View style={styles.screenWrapper}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top bar back */}
        <TouchableOpacity style={styles.backArrowBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrowText}>← Quay lại trang chủ</Text>
        </TouchableOpacity>

        {/* Countdown Banner */}
        <View style={styles.countdownBanner}>
          <View style={styles.countdownHeaderRow}>
            <Text style={styles.countdownTitle}>✦ BẢN XEM TRƯỚC 50% QUẺ BÓI ✦</Text>
            <MysticBadge label="Lưu 7 ngày" variant="gold" size="sm" />
          </View>
          <Text style={styles.countdownText}>
            Thời hạn nhận quẻ: <Text style={styles.countdownHighlight}>{countdownText || 'Đang đếm...'}</Text>
          </Text>
        </View>

        {/* Preview Card */}
        <TarotCard style={styles.card}>
          <View style={styles.metaRow}>
            <MysticBadge label={`✦ ${schoolName}`} variant="gold" size="sm" />
            <MysticBadge label={handName} variant="mute" size="sm" />
          </View>

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
              <Text style={styles.sectionHeader}>✦ Tổng quan năng lượng bàn tay</Text>
              <Text style={styles.bodyText}>{preview.summary}</Text>
            </View>
          )}

          {/* Sections list with locks */}
          <Text style={styles.groupHeader}>📜 Các đường chỉ tay chính</Text>
          {preview.sections?.map((sec, idx) => {
            const isLocked = sec.isLocked;
            return (
              <View
                key={sec.key || idx}
                style={[styles.itemCard, isLocked && styles.itemCardLocked]}
              >
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>✦ {sec.title || sec.key}</Text>
                  {isLocked && <MysticBadge label="Đang khóa" icon="🔒" variant="rose" size="sm" />}
                </View>

                {isLocked ? (
                  <View style={styles.lockedPlaceholder}>
                    <Text style={styles.lockedText}>
                      Đăng ký tài khoản nhận +3 credits miễn phí để mở khóa toàn bộ quan sát đặc trưng & luận giải chi tiết cung này.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 6, marginTop: 4 }}>
                    {sec.observation && (
                      <View>
                        <Text style={styles.subItemLabel}>Nhận diện thực tế:</Text>
                        <Text style={styles.bodyText}>{sec.observation}</Text>
                      </View>
                    )}
                    {sec.meaning && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={styles.subItemLabelGold}>Ý nghĩa luận giải:</Text>
                        <Text style={styles.bodyTextHighlight}>{sec.meaning}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {/* Aspects with locks */}
          <Text style={styles.groupHeader}>✨ 6 Khía cạnh cuộc sống</Text>
          {preview.aspects &&
            Object.entries(preview.aspects).map(([key, val]: any) => (
              <View key={key} style={[styles.itemCard, styles.itemCardLocked]}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>◆ {val?.title || key.toUpperCase()}</Text>
                  <MysticBadge label="Đang khóa" icon="🔒" variant="rose" size="sm" />
                </View>
                <Text style={styles.lockedText}>
                  Luận giải vận hạn, tình duyên, tài lộc và sự nghiệp chi tiết đang chờ bạn mở khóa.
                </Text>
              </View>
            ))}
        </TarotCard>

        {/* Space for bottom floating bar */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating Bottom Unlock Bar */}
      <View style={styles.stickyUnlockContainer}>
        <View style={styles.stickyUnlockCard}>
          <View style={styles.stickyTextCol}>
            <Text style={styles.stickyUnlockTitle}>
              🎁 Đăng ký nhận +3 Credits
            </Text>
            <Text style={styles.stickyUnlockDesc}>
              Mở khóa 100% bài bói & lưu vĩnh viễn
            </Text>
          </View>

          <MysticButton
            title="Mở Khóa Ngay"
            icon="✨"
            variant="primary"
            size="md"
            onPress={() => onRegisterToUnlock(claimToken)}
          />
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
    paddingBottom: 20,
    gap: 12,
  },
  centerBox: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: '#d8cbe8',
    fontSize: 14,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fb7185',
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 13,
    color: '#9e8cb8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },

  backArrowBtn: {
    paddingVertical: 6,
  },
  backArrowText: {
    fontSize: 13.5,
    color: '#d4af37',
    fontWeight: '600',
  },

  countdownBanner: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
    gap: 4,
  },
  countdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f7e7b4',
    letterSpacing: 1,
  },
  countdownText: {
    fontSize: 12,
    color: '#d8cbe8',
  },
  countdownHighlight: {
    color: '#34d399',
    fontWeight: '700',
  },

  card: {
    padding: 16,
    gap: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageWrap: {
    width: '100%',
    alignItems: 'center',
  },
  palmImage: {
    width: '100%',
    height: 240,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },

  sectionBox: {
    backgroundColor: 'rgba(20, 13, 38, 0.85)',
    borderLeftWidth: 3,
    borderLeftColor: '#d4af37',
    padding: 12,
    borderRadius: 6,
    gap: 4,
  },
  sectionHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#d4af37',
  },
  bodyText: {
    fontSize: 13,
    color: '#d8cbe8',
    lineHeight: 18,
  },
  bodyTextHighlight: {
    fontSize: 13,
    color: '#f5e6c8',
    lineHeight: 18,
  },
  subItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9e8cb8',
  },
  subItemLabelGold: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d4af37',
  },

  groupHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f7e7b4',
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
    gap: 6,
  },
  itemCardLocked: {
    backgroundColor: 'rgba(27, 18, 51, 0.5)',
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5e6c8',
  },
  lockedPlaceholder: {
    paddingVertical: 4,
  },
  lockedText: {
    fontSize: 12,
    color: '#9e8cb8',
    lineHeight: 17,
    fontStyle: 'italic',
  },

  // STICKY BOTTOM BAR
  stickyUnlockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(11, 7, 22, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
  },
  stickyUnlockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f1438',
    borderWidth: 1,
    borderColor: '#d4af37',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  stickyTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  stickyUnlockTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#f7e7b4',
  },
  stickyUnlockDesc: {
    fontSize: 11,
    color: '#9e8cb8',
    marginTop: 2,
  },
});

export default GuestReadingPreviewScreen;
