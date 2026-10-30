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
        .catch((err) => {
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
            } catch (err) {
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
        <ActivityIndicator size="large" color={PALMSIGHT_MOBILE_THEME.colors.gold} />
        <Text style={styles.loadingText}>Đang khai mở cuộn văn thư bí truyền...</Text>
      </View>
    );
  }

  if (!reading) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>Không tìm thấy bài luận giải này.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>&larr; Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const result = reading.result;
  const schoolConfig = READING_SCHOOLS[reading.school];
  const schoolName = schoolConfig?.name || reading.school;
  const handName = reading.hand === HandOrientation.RIGHT ? 'Tay Phải' : 'Tay Trái';

  const getAspectLabel = (key: string) => {
    const found = LIFE_ASPECTS.find((a) => a.key === key);
    return found ? found.label : key.toUpperCase();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Bar Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backArrowBtn} onPress={onBack}>
          <Text style={styles.backArrowText}>&larr; Quay lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={deleting}
        >
          <Text style={styles.deleteBtnText}>🗑 Xóa quẻ</Text>
        </TouchableOpacity>
      </View>

      {/* Main Card */}
      <TarotCard style={styles.mainCard}>
        {/* Header Metadata */}
        <View style={styles.metaRow}>
          <View style={styles.badgeSchool}>
            <Text style={styles.badgeSchoolText}>✦ {schoolName}</Text>
          </View>
          <View style={styles.badgeHand}>
            <Text style={styles.badgeHandText}>{handName}</Text>
          </View>
        </View>

        <Text style={styles.readingTitle}>Bản Luận Giải Vận Mệnh</Text>
        <Text style={styles.readingDate}>{formatDate(reading.createdAt)}</Text>

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

        {/* Hand Image */}
        {(reading.imageUrl || reading.annotatedImageUrl) && (
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: reading.annotatedImageUrl || reading.imageUrl || '' }}
              style={styles.palmImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* 1. Summary / Overview */}
        {result?.summary && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeader}>🌟 Tổng Quan Vận Mệnh</Text>
            <Text style={styles.bodyText}>{result.summary}</Text>
          </View>
        )}

        {/* 2. Sections (Chỉ tay & Cung) */}
        {Array.isArray(result?.sections) && result.sections.length > 0 && (
          <View style={styles.sectionGroup}>
            <Text style={styles.groupHeader}>📜 Luận Giải Các Đường Chỉ Chính</Text>
            {result.sections.map((sec, idx) => (
              <View key={sec.key || idx} style={styles.itemCard}>
                <Text style={styles.itemTitle}>🔹 {sec.title || sec.key}</Text>
                {sec.observation && (
                  <View style={styles.subItemRow}>
                    <Text style={styles.subItemLabel}>Dấu hiệu quan sát:</Text>
                    <Text style={styles.bodyText}>{sec.observation}</Text>
                  </View>
                )}
                {sec.meaning && (
                  <View style={styles.subItemRow}>
                    <Text style={styles.subItemLabel}>Ý nghĩa thiên mệnh:</Text>
                    <Text style={styles.bodyTextHighlight}>{sec.meaning}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 3. Aspects (Khía cạnh cuộc sống) */}
        {result?.aspects && Object.keys(result.aspects).length > 0 && (
          <View style={styles.sectionGroup}>
            <Text style={styles.groupHeader}>✨ 6 Khía Cạnh Đời Người</Text>
            {Object.entries(result.aspects).map(([key, val]: any) => (
              <View key={key} style={styles.aspectCard}>
                <Text style={styles.aspectTitle}>◆ {getAspectLabel(key)}</Text>
                <Text style={styles.bodyText}>
                  {typeof val === 'string' ? val : val?.description || val?.content}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 4. Advice */}
        {result?.advice && (
          <View style={[styles.sectionBox, styles.adviceBox]}>
            <Text style={styles.adviceTitle}>💡 Lời Khuyên Định Hướng</Text>
            <Text style={styles.bodyText}>{result.advice}</Text>
          </View>
        )}

        {/* 5. Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            {result?.disclaimer ||
              '✦ Quẻ bói chỉ mang tính chất tham khảo & chiêm nghiệm tinh thần. Vận mệnh nằm trong tay bạn.'}
          </Text>
        </View>
      </TarotCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
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
  errorText: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
    fontSize: 15,
    marginBottom: 16,
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
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backArrowBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backArrowText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    backgroundColor: 'rgba(251, 113, 133, 0.12)',
    borderColor: 'rgba(251, 113, 133, 0.4)',
    borderWidth: 1,
  },
  deleteBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  mainCard: {
    padding: 20,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginVertical: 4,
  },
  readingDate: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    marginBottom: 16,
  },
  rejectedBanner: {
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
    borderColor: PALMSIGHT_MOBILE_THEME.colors.danger,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
    marginBottom: 16,
  },
  rejectedTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  rejectedDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 13,
    lineHeight: 18,
  },
  imageWrap: {
    width: '100%',
    height: 240,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
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
  sectionGroup: {
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 14,
    marginBottom: 10,
  },
  itemTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
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
  aspectCard: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
    marginBottom: 8,
  },
  aspectTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldDim,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  adviceBox: {
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
  },
  adviceTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  disclaimerBox: {
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
  },
  disclaimerText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ReadingDetailScreen;
