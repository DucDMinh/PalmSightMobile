import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import readingsService from '../services/readingsService';
import { formatDate } from '../helpers/common';
import { useAuth } from '../providers/AuthenticationProvider';
import {
  ReadingListItemDto,
  ReadingDto,
  ReadingStatus,
  READING_SCHOOLS,
  HandOrientation,
} from '@palmsight/shared';

interface HistoryScreenProps {
  onGoScan: () => void;
  onGoLogin: () => void;
  onSelectReading: (readingId: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onGoScan,
  onGoLogin,
  onSelectReading,
}) => {
  const { isLogged } = useAuth();
  const [items, setItems] = useState<ReadingListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!isLogged) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await readingsService.getReadings();
      setItems(data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLogged]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderStatusBadge = (status: ReadingStatus) => {
    switch (status) {
      case ReadingStatus.DONE:
        return (
          <View style={[styles.statusBadge, styles.statusDone]}>
            <Text style={styles.statusDoneText}>✦ Hoàn tất</Text>
          </View>
        );
      case ReadingStatus.PROCESSING:
        return (
          <View style={[styles.statusBadge, styles.statusProcessing]}>
            <Text style={styles.statusProcessingText}>⏳ Đang giải</Text>
          </View>
        );
      case ReadingStatus.REJECTED:
        return (
          <View style={[styles.statusBadge, styles.statusRejected]}>
            <Text style={styles.statusRejectedText}>⚠️ Bị từ chối</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, styles.statusFailed]}>
            <Text style={styles.statusFailedText}>✕ Thất bại</Text>
          </View>
        );
    }
  };

  if (!isLogged) {
    return (
      <View style={styles.centerContainer}>
        <TarotCard style={styles.promptCard}>
          <Text style={styles.promptBadge}>✦ SỔ THIÊN MỆNH</Text>
          <Text style={styles.promptTitle}>Lịch sử quẻ bói</Text>
          <Text style={styles.promptDesc}>
            Đăng nhập tài khoản để lưu trữ vĩnh viễn và xem lại các bản luận giải chỉ tay của bạn mọi lúc.
          </Text>
          <TouchableOpacity style={styles.loginBtn} onPress={onGoLogin}>
            <Text style={styles.loginBtnText}>[ ĐĂNG NHẬP HOẶC ĐĂNG KÝ ]</Text>
          </TouchableOpacity>
        </TarotCard>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PALMSIGHT_MOBILE_THEME.colors.gold} />
        <Text style={styles.loadingText}>Đang tra cứu cổ thư thiên mệnh...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={PALMSIGHT_MOBILE_THEME.colors.gold}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBox}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.badgeTop}>✦ SỔ THIÊN MỆNH · LƯU TRỮ</Text>
                <Text style={styles.mainTitle}>Lịch sử xem bói</Text>
              </View>
              <TouchableOpacity style={styles.newReadingBtn} onPress={onGoScan}>
                <Text style={styles.newReadingBtnText}>+ Bói mới</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.countText}>
              Đang lưu giữ {items.length} quẻ bói
            </Text>
          </View>
        }
        ListEmptyComponent={
          <TarotCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyTitle}>Chưa có quẻ bói nào</Text>
            <Text style={styles.emptyDesc}>
              Bạn chưa thực hiện lần xem bói nào. Hãy khai quẻ đầu tiên ngay bây giờ!
            </Text>
            <TouchableOpacity style={styles.startScanBtn} onPress={onGoScan}>
              <Text style={styles.startScanBtnText}>[ BẮT ĐẦU XEM BÓI ]</Text>
            </TouchableOpacity>
          </TarotCard>
        }
        renderItem={({ item }) => {
          const schoolCfg = READING_SCHOOLS[item.school];
          const schoolName = schoolCfg?.name || item.school;
          const handName =
            item.hand === HandOrientation.RIGHT ? 'Tay Phải' : 'Tay Trái';

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onSelectReading(item.id)}
            >
              <TarotCard style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.schoolBadge}>
                    <Text style={styles.schoolBadgeText}>✦ {schoolName}</Text>
                  </View>
                  <Text style={styles.handBadgeText}>{handName}</Text>
                  <View style={styles.spacer} />
                  {renderStatusBadge(item.status)}
                </View>

                <View style={styles.itemBody}>
                  {item.imageUrl && (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.summaryWrap}>
                    <Text style={styles.summaryText} numberOfLines={3}>
                      {item.summary ||
                        'Nhấn vào để đọc trọn vẹn toàn bộ bản luận giải chi tiết...'}
                    </Text>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
              </TarotCard>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginTop: 12,
    fontSize: 14,
  },
  promptCard: {
    alignItems: 'center',
    padding: 28,
  },
  promptBadge: {
    fontSize: 10,
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 6,
  },
  promptTitle: {
    fontSize: 24,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 8,
  },
  promptDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  loginBtnText: {
    color: '#120a21',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  headerBox: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeTop: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 26,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  countText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 12,
    marginTop: 4,
  },
  newReadingBtn: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
  },
  newReadingBtnText: {
    color: '#120a21',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  startScanBtn: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  startScanBtnText: {
    color: '#120a21',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  itemCard: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  schoolBadge: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    marginRight: 6,
  },
  schoolBadgeText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  handBadgeText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 11,
  },
  spacer: {
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
  },
  statusDone: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderWidth: 1,
  },
  statusDoneText: {
    color: PALMSIGHT_MOBILE_THEME.colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  statusProcessing: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
  },
  statusProcessingText: {
    color: PALMSIGHT_MOBILE_THEME.colors.warning,
    fontSize: 10,
    fontWeight: '700',
  },
  statusRejected: {
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
    borderColor: 'rgba(251, 113, 133, 0.4)',
    borderWidth: 1,
  },
  statusRejectedText: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
    fontSize: 10,
    fontWeight: '700',
  },
  statusFailed: {
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
  },
  statusFailedText: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
    fontSize: 10,
  },
  itemBody: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
  },
  summaryWrap: {
    flex: 1,
    justifyContent: 'space-between',
  },
  summaryText: {
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 13,
    lineHeight: 18,
  },
  dateText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 11,
    marginTop: 4,
  },
});

export default HistoryScreen;
