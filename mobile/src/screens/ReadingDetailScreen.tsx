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
        <TouchableOpacity style={styles.btnBackCenter} onPress={onBack}>
          <Text style={styles.btnBackCenterText}>&larr; Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const result = reading.result;
  const schoolConfig = READING_SCHOOLS[reading.school];
  const schoolName = schoolConfig?.name || reading.school;
  const handName = reading.hand === HandOrientation.RIGHT ? 'Tay phải' : 'Tay trái';
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

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>&larr; Quay lại Lịch sử</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={deleting}
        >
          <Text style={styles.deleteBtnText}>🗑 Xóa quẻ</Text>
        </TouchableOpacity>
      </View>

      {/* Palm Header Card */}
      <TarotCard style={styles.palmHeaderCard}>
        {(reading.imageUrl || reading.annotatedImageUrl) && (
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: reading.annotatedImageUrl || reading.imageUrl || '' }}
              style={styles.palmImage}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={styles.headerMetaRow}>
          <View style={styles.badgeSchool}>
            <Text style={styles.badgeSchoolText}>{schoolName}</Text>
          </View>
          <View style={styles.badgeHand}>
            <Text style={styles.badgeHandText}>{handName}</Text>
          </View>
          <Text style={styles.readingDate}>{formatDate(reading.createdAt)}</Text>
        </View>

        {/* Status notice */}
        {reading.status === ReadingStatus.REJECTED && (
          <View style={styles.rejectedBanner}>
            <Text style={styles.rejectedTitle}>⚠️ Không thể luận giải</Text>
            <Text style={styles.rejectedDesc}>
              {reading.rejectReason ||
                'Ảnh bàn tay không đủ độ sắc nét hoặc góc chụp chưa chuẩn xác. Vui lòng chụp lại.'}
            </Text>
          </View>
        )}
      </TarotCard>

      {/* Main Luận Giải Chi Tiết Card */}
      <TarotCard style={styles.detailCard}>
        {/* Header row */}
        <View style={styles.detailCardHeader}>
          <View style={styles.detailCardHeaderLeft}>
            <Text style={styles.scrollIcon}>📜</Text>
            <Text style={styles.detailCardTitle}>Luận Giải Chi Tiết</Text>
          </View>
          <View style={styles.schoolPill}>
            <Text style={styles.schoolPillText}>{schoolName}</Text>
          </View>
        </View>

        {/* Quality warning */}
        {isPoorQuality && (
          <View style={styles.poorQualityBox}>
            <Text style={styles.poorQualityText}>
              [!] Ảnh hơi mờ, kết quả có thể chưa chính xác.
            </Text>
          </View>
        )}

        {/* Selected topics pills */}
        {!isAll && reading.topics && reading.topics.length > 0 && (
          <View style={styles.selectedTopicsBanner}>
            <Text style={styles.selectedTopicsLabel}>Mục đã chọn:</Text>
            <View style={styles.selectedTopicsList}>
              {reading.topics.map((key) => (
                <View key={key} style={styles.topicPill}>
                  <Text style={styles.topicPillText}>
                    {getTopicLabel(key, reading.school)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary box */}
        {result?.summary && (
          <View style={styles.summaryBox}>
            <View style={styles.summaryTitleRow}>
              <Text style={styles.summaryIcon}>✨</Text>
              <Text style={styles.summaryTitle}>Tóm tắt</Text>
            </View>
            <Text style={styles.summaryText}>{result.summary}</Text>
          </View>
        )}

        {/* Sections: Đường chỉ chính */}
        {Array.isArray(result?.sections) && result.sections.length > 0 && (
          <View style={styles.blockGroup}>
            <Text style={styles.blockHeading}>
              ✦ Đường chỉ & Dấu hiệu chiêm đoán
            </Text>
            {result.sections.map((sec, idx) => (
              <View key={sec.key || idx} style={styles.sectionItemCard}>
                <Text style={styles.sectionItemTitle}>
                  {sec.title || sec.key}
                </Text>

                {sec.observation && (
                  <View style={styles.subBoxObservation}>
                    <View style={styles.subBoxTitleRow}>
                      <Text style={styles.subBoxIcon}>👁️</Text>
                      <Text style={styles.subBoxTitle}>[+] Quan sát</Text>
                    </View>
                    <Text style={styles.subBoxContent}>{sec.observation}</Text>
                  </View>
                )}

                {sec.meaning && (
                  <View style={styles.subBoxMeaning}>
                    <View style={styles.subBoxTitleRow}>
                      <Text style={styles.subBoxIcon}>✨</Text>
                      <Text style={styles.subBoxTitle}>[+] Ý nghĩa</Text>
                    </View>
                    <Text style={styles.subBoxContentHighlight}>
                      {sec.meaning}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Aspects: Khía cạnh cuộc sống */}
        {result?.aspects && Object.keys(result.aspects).length > 0 && (
          <View style={styles.blockGroup}>
            <Text style={styles.blockHeading}>✦ Khía cạnh cuộc sống</Text>
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

        {/* Advice */}
        {result?.advice && (
          <View style={styles.adviceBox}>
            <View style={styles.adviceHeaderRow}>
              <Text style={styles.adviceIcon}>🧭</Text>
              <Text style={styles.adviceTitle}>Lời khuyên</Text>
            </View>
            <Text style={styles.adviceText}>{result.advice}</Text>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            {result?.disclaimer ||
              '✧ Thông tin chiêm đoán chỉ mang tính chất tham khảo & giải trí. Vận mệnh thực sự nằm trong tay bạn.'}
          </Text>
        </View>
      </TarotCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
    backgroundColor: '#0b0716',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0b0716',
  },
  loadingText: {
    marginTop: 14,
    color: '#d8cbe8',
    fontSize: 14,
  },
  errorText: {
    color: '#fb7185',
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'center',
  },
  btnBackCenter: {
    backgroundColor: 'rgba(27, 18, 51, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  btnBackCenterText: {
    color: '#f7e7b4',
    fontSize: 13,
    fontWeight: '600',
  },

  // Top Nav
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    paddingVertical: 6,
  },
  backBtnText: {
    color: 'rgba(247, 231, 180, 0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.4)',
    backgroundColor: 'rgba(76, 5, 25, 0.3)',
  },
  deleteBtnText: {
    color: '#fb7185',
    fontSize: 12,
    fontWeight: '600',
  },

  // Palm Header Card
  palmHeaderCard: {
    padding: 14,
    marginBottom: 16,
  },
  imageWrap: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0b0716',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 12,
  },
  palmImage: {
    width: '100%',
    height: '100%',
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeSchool: {
    backgroundColor: '#241842',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeSchoolText: {
    color: '#f7e7b4',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeHand: {
    backgroundColor: 'rgba(11, 7, 22, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeHandText: {
    color: '#d8cbe8',
    fontSize: 12,
  },
  readingDate: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 11,
    color: '#9e8cb8',
    marginLeft: 'auto',
  },
  rejectedBanner: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 5, 25, 0.4)',
    borderWidth: 1,
    borderColor: '#fb7185',
  },
  rejectedTitle: {
    color: '#fb7185',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  rejectedDesc: {
    color: '#f5e6c8',
    fontSize: 12,
    lineHeight: 18,
  },

  // Detail Card
  detailCard: {
    padding: 16,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 14,
  },
  detailCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollIcon: {
    fontSize: 16,
  },
  detailCardTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 18,
    fontWeight: '800',
    color: '#f7e7b4',
  },
  schoolPill: {
    backgroundColor: '#241842',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  schoolPillText: {
    color: '#f7e7b4',
    fontSize: 11,
    fontWeight: '600',
  },

  poorQualityBox: {
    backgroundColor: 'rgba(36, 24, 66, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.6)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  poorQualityText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },

  selectedTopicsBanner: {
    backgroundColor: 'rgba(11, 7, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  selectedTopicsLabel: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  selectedTopicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicPill: {
    backgroundColor: '#241842',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  topicPillText: {
    color: '#f7e7b4',
    fontSize: 11,
  },

  // Summary Box
  summaryBox: {
    backgroundColor: 'rgba(44, 29, 79, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 6,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
  },
  summaryIcon: {
    fontSize: 14,
  },
  summaryTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 18,
    fontWeight: '800',
    color: '#f7e7b4',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#f5e6c8',
  },

  // Block Groups
  blockGroup: {
    marginBottom: 20,
  },
  blockHeading: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 18,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 10,
  },

  sectionItemCard: {
    backgroundColor: 'rgba(11, 7, 22, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  sectionItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 8,
  },
  subBoxObservation: {
    backgroundColor: 'rgba(20, 13, 38, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  subBoxMeaning: {
    backgroundColor: 'rgba(20, 13, 38, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 10,
    padding: 10,
  },
  subBoxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  subBoxIcon: {
    fontSize: 13,
  },
  subBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f7e7b4',
  },
  subBoxContent: {
    fontSize: 13,
    color: '#d8cbe8',
    lineHeight: 19,
  },
  subBoxContentHighlight: {
    fontSize: 13,
    color: '#f5e6c8',
    lineHeight: 19,
    fontWeight: '500',
  },

  // Aspects
  aspectsStack: {
    gap: 8,
  },
  aspectCard: {
    backgroundColor: 'rgba(11, 7, 22, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  aspectHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 4,
  },
  aspectBody: {
    fontSize: 13,
    color: '#d8cbe8',
    lineHeight: 19,
  },

  // Advice
  adviceBox: {
    backgroundColor: 'rgba(36, 24, 66, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 6,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
  },
  adviceIcon: {
    fontSize: 14,
  },
  adviceTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 17,
    fontWeight: '800',
    color: '#f7e7b4',
  },
  adviceText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#f5e6c8',
  },

  // Disclaimer
  disclaimerBox: {
    paddingTop: 8,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#9e8cb8',
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default ReadingDetailScreen;
