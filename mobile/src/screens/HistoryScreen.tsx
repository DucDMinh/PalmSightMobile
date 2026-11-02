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
  ReadingStatus,
  READING_SCHOOLS,
  HandOrientation,
} from '@palmsight/shared';
import { MysticButton } from '../components/MysticButton';
import { MysticBadge } from '../components/MysticBadge';

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
        return <MysticBadge label="Đã hoàn thành" icon="✓" variant="emerald" size="sm" />;
      case ReadingStatus.PROCESSING:
        return <MysticBadge label="Đang luận giải" icon="⏳" variant="gold" size="sm" />;
      case ReadingStatus.REJECTED:
        return <MysticBadge label="Hoàn 1 credit" icon="↩" variant="rose" size="sm" />;
      default:
        return <MysticBadge label="Đã hoàn credit" icon="↩" variant="rose" size="sm" />;
    }
  };

  if (!isLogged) {
    return (
      <View style={styles.centerContainer}>
        <TarotCard style={styles.promptCard}>
          <Text style={styles.promptBadge}>✦ SỔ THIÊN MỆNH ✦</Text>
          <Text style={styles.promptTitle}>Lịch sử quẻ bói</Text>
          <Text style={styles.promptDesc}>
            Đăng nhập để lưu trữ vĩnh viễn và xem lại các bản đồ chỉ tay cùng bài luận giải của bạn mọi lúc mọi nơi.
          </Text>
          <MysticButton
            title="Đăng nhập hoặc Đăng ký"
            icon="✨"
            variant="primary"
            size="md"
            onPress={onGoLogin}
            fullWidth
          />
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
                <Text style={styles.badgeTop}>✦ SỔ THIÊN MỆNH · LƯU TRỮ QUẺ BÓI</Text>
                <Text style={styles.mainTitle}>Lịch Sử Xem Bói</Text>
              </View>
              <MysticButton
                title="+ Khai quẻ mới"
                variant="primary"
                size="sm"
                onPress={onGoScan}
              />
            </View>
            <Text style={styles.countText}>
              ✦ Tổng số: {items.length} bài bói đã lưu
            </Text>
          </View>
        }
        ListEmptyComponent={
          <TarotCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyTitle}>Chưa có quẻ bói nào</Text>
            <Text style={styles.emptyDesc}>
              Bạn chưa xem bói lần nào. Hãy chụp bàn tay để AI khai quẻ đầu tiên cho bạn!
            </Text>
            <MysticButton
              title="Khai quẻ đầu tiên ngay"
              icon="✨"
              variant="primary"
              size="md"
              onPress={onGoScan}
              style={{ marginTop: 14 }}
            />
          </TarotCard>
        }
        renderItem={({ item }) => {
          const schoolCfg = READING_SCHOOLS[item.school];
          const rawName = schoolCfg?.name?.replace('Chỉ tay ', '') || item.school;
          const schoolName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          const handName =
            item.hand === HandOrientation.RIGHT ? 'Tay Phải' : 'Tay Trái';

          const totalSections = schoolCfg?.sections?.length ?? 0;
          const isAll =
            !item.topics ||
            item.topics.length === 0 ||
            item.topics.length >= totalSections + 6;
          const topicsBadge = isAll ? 'Toàn bộ mục' : `${item.topics.length} mục`;

          return (
            <TouchableOpacity
              activeOpacity={0.84}
              onPress={() => onSelectReading(item.id)}
            >
              <TarotCard style={styles.itemCard} interactive>
                <View style={styles.itemHeader}>
                  <View style={styles.itemHeaderLeft}>
                    <MysticBadge
                      label={`✦ ${schoolName}`}
                      variant="gold"
                      size="sm"
                    />
                    <Text style={styles.handBadgeText}>{handName} · {topicsBadge}</Text>
                  </View>
                  {renderStatusBadge(item.status)}
                </View>

                <View style={styles.itemBody}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Text style={styles.thumbnailPlaceholderIcon}>✋</Text>
                    </View>
                  )}
                  <View style={styles.summaryWrap}>
                    <Text style={styles.summaryText} numberOfLines={3}>
                      {item.summary ||
                        'Chạm vào để xem bản đồ các đường chỉ tay và bài luận giải chi tiết...'}
                    </Text>
                    <View style={styles.itemFooterRow}>
                      <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                      <Text style={styles.viewDetailText}>Xem chi tiết →</Text>
                    </View>
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
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginTop: 14,
    fontSize: 14,
  },
  promptCard: {
    alignItems: 'center',
    padding: 24,
    width: '100%',
    gap: 12,
  },
  promptBadge: {
    fontSize: 10.5,
    color: '#d4af37',
    letterSpacing: 2,
    fontWeight: '700',
  },
  promptTitle: {
    fontSize: 22,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
  },
  promptDesc: {
    fontSize: 13.5,
    color: '#9e8cb8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },

  headerBox: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeTop: {
    fontSize: 10,
    color: '#d4af37',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  mainTitle: {
    fontSize: 22,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
  },
  countText: {
    fontSize: 12,
    color: '#9e8cb8',
    marginTop: 4,
  },

  emptyCard: {
    alignItems: 'center',
    padding: 28,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#9e8cb8',
    textAlign: 'center',
    lineHeight: 18,
  },

  itemCard: {
    padding: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handBadgeText: {
    fontSize: 11.5,
    color: '#d8cbe8',
    fontWeight: '500',
  },

  itemBody: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(27, 18, 51, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderIcon: {
    fontSize: 28,
  },
  summaryWrap: {
    flex: 1,
    justifyContent: 'space-between',
  },
  summaryText: {
    fontSize: 12.5,
    color: '#f5e6c8',
    lineHeight: 18,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#7e6d99',
  },
  viewDetailText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#d4af37',
  },
});

export default HistoryScreen;
