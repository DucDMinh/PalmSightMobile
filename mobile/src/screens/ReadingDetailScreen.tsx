import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import readingsService from '../services/readingsService';
import { formatDate } from '../helpers/common';
import { showError, showSuccess } from '../helpers/toast';
import {
  ReadingDto,
  READING_SCHOOLS,
  HandOrientation,
  ReadingStatus,
  LIFE_ASPECTS,
  ImageQuality,
  getTopicLabel,
} from '@palmsight/shared';
import { MysticButton } from '../components/MysticButton';
import { MysticBadge } from '../components/MysticBadge';

interface ReadingDetailScreenProps {
  readingId?: string | null;
  initialReading?: ReadingDto | null;
  onBack: () => void;
  onDeleted?: () => void;
}

export const ReadingDetailScreen: React.FC<ReadingDetailScreenProps> = ({
  readingId,
  initialReading,
  onBack,
  onDeleted,
}) => {
  const [reading, setReading] = useState<ReadingDto | null>(initialReading || null);
  const [loading, setLoading] = useState<boolean>(!initialReading && !!readingId);
  const [deleting, setDeleting] = useState(false);
  const [showAnnotated, setShowAnnotated] = useState(true);

  useEffect(() => {
    if (readingId && !initialReading) {
      let active = true;
      setLoading(true);
      readingsService
        .getReadingById(readingId)
        .then((data) => {
          if (active) setReading(data);
        })
        .catch(() => {
          showError('Không thể tải bài luận giải chi tiết.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }
  }, [readingId, initialReading]);

  const handleDelete = () => {
    if (!reading) return;
    Alert.alert(
      'Xóa bài luận giải',
      'Bạn có chắc chắn muốn xóa bài bói này khỏi sổ thiên mệnh? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await readingsService.deleteReading(reading.id);
              showSuccess('Đã xóa bài bói.');
              onDeleted?.();
              onBack();
            } catch {
              showError('Không thể xóa bài bói lúc này.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.loadingText}>Đang khai mở cuộn văn thư bí truyền...</Text>
      </View>
    );
  }

  if (!reading) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>Không tìm thấy bài luận giải này.</Text>
        <MysticButton title="← Quay lại Lịch sử" variant="secondary" size="md" onPress={onBack} />
      </View>
    );
  }

  const result = reading.result;
  const schoolConfig = READING_SCHOOLS[reading.school];
  const schoolName = schoolConfig?.name || reading.school;
  const handName = reading.hand === HandOrientation.RIGHT ? 'Tay Phải' : 'Tay Trái';
  const isPoorQuality = result?.imageQuality === ImageQuality.POOR;
  const totalSections = schoolConfig?.sections?.length ?? 0;
  const isAll =
    !reading.topics ||
    reading.topics.length === 0 ||
    reading.topics.length >= totalSections + 6;

  const getAspectLabel = (key: string) => {
    const found = LIFE_ASPECTS.find((a) => a.key === key);
    return found ? found.label : key;
  };

  const currentDisplayImage =
    showAnnotated && reading.annotatedImageUrl
      ? reading.annotatedImageUrl
      : reading.imageUrl || reading.annotatedImageUrl;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← Trở về Lịch Sử</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteBtnText}>🗑 Xóa</Text>
        </TouchableOpacity>
      </View>

      {/* 1. PALM IMAGE VIEWER CARD */}
      <TarotCard style={styles.palmHeaderCard}>
        {currentDisplayImage ? (
          <View style={styles.imageSection}>
            <Image
              source={{ uri: currentDisplayImage }}
              style={styles.palmImage}
              resizeMode="cover"
            />

            {/* Toggle Annotated vs Original Image */}
            {reading.annotatedImageUrl && reading.imageUrl && (
              <View style={styles.imageToggleBar}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    showAnnotated && styles.toggleBtnActive,
                  ]}
                  onPress={() => setShowAnnotated(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      showAnnotated && styles.toggleBtnTextActive,
                    ]}
                  >
                    ✦ AI Vẽ Chỉ Tay
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    !showAnnotated && styles.toggleBtnActive,
                  ]}
                  onPress={() => setShowAnnotated(false)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      !showAnnotated && styles.toggleBtnTextActive,
                    ]}
                  >
                    Ảnh Gốc
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 4 Palm lines legend */}
            <View style={styles.lineLegendRow}>
              <View style={styles.lineLegendItem}>
                <View style={[styles.dot, { backgroundColor: '#fb7185' }]} />
                <Text style={styles.legendText}>Tâm Đạo</Text>
              </View>
              <View style={styles.lineLegendItem}>
                <View style={[styles.dot, { backgroundColor: '#c084fc' }]} />
                <Text style={styles.legendText}>Trí Đạo</Text>
              </View>
              <View style={styles.lineLegendItem}>
                <View style={[styles.dot, { backgroundColor: '#f5d77f' }]} />
                <Text style={styles.legendText}>Sinh Đạo</Text>
              </View>
              <View style={styles.lineLegendItem}>
                <View style={[styles.dot, { backgroundColor: '#34d399' }]} />
                <Text style={styles.legendText}>Định Mệnh</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Metadata Badges */}
        <View style={styles.headerMetaRow}>
          <MysticBadge label={`✦ ${schoolName}`} variant="gold" size="sm" />
          <MysticBadge label={handName} variant="mute" size="sm" />
          <Text style={styles.readingDate}>{formatDate(reading.createdAt)}</Text>
        </View>

        {/* Rejected Notice */}
        {reading.status === ReadingStatus.REJECTED && (
          <View style={styles.rejectedBanner}>
            <Text style={styles.rejectedTitle}>⚠️ Không thể luận giải</Text>
            <Text style={styles.rejectedDesc}>
              {reading.rejectReason ||
                'Ảnh bàn tay không đủ độ sắc nét hoặc góc chụp chưa chuẩn xác. Credit đã được hoàn trả vào ví của bạn.'}
            </Text>
          </View>
        )}
      </TarotCard>

      {/* 2. DETAIL READING CARD */}
      <TarotCard style={styles.detailCard}>
        <View style={styles.detailCardHeader}>
          <Text style={styles.scrollIcon}>📜</Text>
          <Text style={styles.detailCardTitle}>Bản Luận Giải Chỉ Tay</Text>
        </View>

        {isPoorQuality && (
          <View style={styles.poorQualityBox}>
            <Text style={styles.poorQualityText}>
              ⚠️ Ảnh chụp hơi mờ, kết quả có thể chưa đạt độ sắc nét tuyệt đối.
            </Text>
          </View>
        )}

        {/* Selected Topics Info */}
        {!isAll && reading.topics && reading.topics.length > 0 && (
          <View style={styles.selectedTopicsBanner}>
            <Text style={styles.selectedTopicsLabel}>Mục đã xem:</Text>
            <View style={styles.selectedTopicsList}>
              {reading.topics.map((key) => (
                <MysticBadge
                  key={key}
                  label={getTopicLabel(key, reading.school)}
                  variant="mute"
                  size="sm"
                />
              ))}
            </View>
          </View>
        )}

        {/* SUMMARY */}
        {result?.summary && (
          <View style={styles.summaryBox}>
            <View style={styles.summaryTitleRow}>
              <Text style={styles.summaryIcon}>✨</Text>
              <Text style={styles.summaryTitle}>Tổng quan thiên mệnh</Text>
            </View>
            <Text style={styles.summaryText}>{result.summary}</Text>
          </View>
        )}

        {/* SECTIONS: ĐƯỜNG CHỈ CHÍNH */}
        {Array.isArray(result?.sections) && result.sections.length > 0 && (
          <View style={styles.blockGroup}>
            <Text style={styles.blockHeading}>
              ✦ Đường Chỉ & Dấu Hiệu Chiêm Đoán
            </Text>
            {result.sections.map((sec, idx) => (
              <View key={sec.key || idx} style={styles.sectionItemCard}>
                <Text style={styles.sectionItemTitle}>
                  {sec.title || sec.key}
                </Text>

                {sec.observation && (
                  <View style={styles.subBoxObservation}>
                    <Text style={styles.subBoxLabel}>👁️ Nhận diện thực tế:</Text>
                    <Text style={styles.subBoxContent}>{sec.observation}</Text>
                  </View>
                )}

                {sec.meaning && (
                  <View style={styles.subBoxMeaning}>
                    <Text style={styles.subBoxLabelGold}>✨ Luận giải ý nghĩa:</Text>
                    <Text style={styles.subBoxContentHighlight}>
                      {sec.meaning}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ASPECTS: KHÍA CẠNH CUỘC SỐNG */}
        {result?.aspects && Object.keys(result.aspects).length > 0 && (
          <View style={styles.blockGroup}>
            <Text style={styles.blockHeading}>✦ Khía Cạnh Cuộc Sống</Text>
            <View style={styles.aspectsStack}>
              {Object.entries(result.aspects).map(([key, val]: any) => (
                <View key={key} style={styles.aspectCard}>
                  <Text style={styles.aspectHeading}>◆ {getAspectLabel(key)}</Text>
                  <Text style={styles.aspectBody}>
                    {typeof val === 'string'
                      ? val
                      : val?.description || val?.content}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ADVICE */}
        {result?.advice && (
          <View style={styles.adviceBox}>
            <View style={styles.adviceHeaderRow}>
              <Text style={styles.adviceIcon}>🧭</Text>
              <Text style={styles.adviceTitle}>Lời Khuyên Chỉ Dẫn</Text>
            </View>
            <Text style={styles.adviceText}>{result.advice}</Text>
          </View>
        )}

        {/* DISCLAIMER */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            {result?.disclaimer ||
              '✧ Thông tin chiêm đoán mang tính chất giải trí & văn hoá cổ truyền. Hành động và ý chí của bạn quyết định tương lai thực sự.'}
          </Text>
        </View>
      </TarotCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
    backgroundColor: '#0b0716',
    gap: 14,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0b0716',
    gap: 12,
  },
  loadingText: {
    marginTop: 14,
    color: '#d8cbe8',
    fontSize: 14,
  },
  errorText: {
    color: '#fb7185',
    fontSize: 15,
    textAlign: 'center',
  },

  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 13.5,
    color: '#d4af37',
    fontWeight: '600',
  },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.3)',
  },
  deleteBtnText: {
    fontSize: 12,
    color: '#fb7185',
    fontWeight: '600',
  },

  // PALM HEADER CARD
  palmHeaderCard: {
    padding: 14,
    gap: 12,
  },
  imageSection: {
    alignItems: 'center',
    gap: 10,
  },
  palmImage: {
    width: '100%',
    height: 300,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
  },
  imageToggleBar: {
    flexDirection: 'row',
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
  },
  toggleBtnActive: {
    backgroundColor: '#d4af37',
  },
  toggleBtnText: {
    fontSize: 12,
    color: '#9e8cb8',
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: '#0b0716',
    fontWeight: '700',
  },
  lineLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  lineLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#d8cbe8',
    fontWeight: '500',
  },

  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
  },
  readingDate: {
    fontSize: 11.5,
    color: '#7e6d99',
  },
  rejectedBanner: {
    backgroundColor: 'rgba(251, 113, 133, 0.12)',
    borderWidth: 1,
    borderColor: '#fb7185',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
  },
  rejectedTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#fda4af',
    marginBottom: 4,
  },
  rejectedDesc: {
    fontSize: 12.5,
    color: '#f5e6c8',
    lineHeight: 18,
  },

  // DETAIL CARD
  detailCard: {
    padding: 16,
    gap: 16,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    paddingBottom: 10,
  },
  scrollIcon: {
    fontSize: 20,
  },
  detailCardTitle: {
    fontSize: 18,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
  },

  poorQualityBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    padding: 10,
  },
  poorQualityText: {
    fontSize: 12,
    color: '#fbbf24',
    lineHeight: 16,
  },

  selectedTopicsBanner: {
    gap: 6,
  },
  selectedTopicsLabel: {
    fontSize: 11.5,
    color: '#9e8cb8',
    fontWeight: '600',
  },
  selectedTopicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  summaryBox: {
    backgroundColor: 'rgba(20, 13, 38, 0.85)',
    borderLeftWidth: 3,
    borderLeftColor: '#d4af37',
    borderRadius: 6,
    padding: 14,
    gap: 6,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryIcon: {
    fontSize: 14,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d4af37',
  },
  summaryText: {
    fontSize: 13.5,
    color: '#f5e6c8',
    lineHeight: 21,
    fontStyle: 'italic',
  },

  blockGroup: {
    gap: 12,
  },
  blockHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f7e7b4',
    letterSpacing: 0.5,
  },

  sectionItemCard: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 14,
    gap: 10,
  },
  sectionItemTitle: {
    fontSize: 15,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#fff3d1',
  },
  subBoxObservation: {
    gap: 4,
  },
  subBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9e8cb8',
    letterSpacing: 0.5,
  },
  subBoxContent: {
    fontSize: 13,
    color: '#d8cbe8',
    lineHeight: 19,
  },
  subBoxMeaning: {
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 6,
    padding: 10,
  },
  subBoxLabelGold: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: 0.5,
  },
  subBoxContentHighlight: {
    fontSize: 13,
    color: '#f5e6c8',
    lineHeight: 19,
  },

  aspectsStack: {
    gap: 8,
  },
  aspectCard: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
    gap: 4,
  },
  aspectHeading: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#d4af37',
  },
  aspectBody: {
    fontSize: 12.5,
    color: '#d8cbe8',
    lineHeight: 18,
  },

  adviceBox: {
    backgroundColor: 'rgba(44, 29, 79, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 14,
    gap: 6,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adviceIcon: {
    fontSize: 16,
  },
  adviceTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#f7e7b4',
  },
  adviceText: {
    fontSize: 13,
    color: '#f5e6c8',
    lineHeight: 19,
  },

  disclaimerBox: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#7e6d99',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

export default ReadingDetailScreen;
