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
import { TarotCard } from '../components/TarotCard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import {
  getReadingsListApi,
  deleteReadingApi,
  describeApiError,
} from '../services/api';

interface HistoryScreenProps {
  token: string | null;
  onGoScan: () => void;
  onGoLogin: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  token,
  onGoScan,
  onGoLogin,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReading, setSelectedReading] = useState<any | null>(null);

  const fetchHistory = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getReadingsListApi(token);
      setItems(data?.items || []);
    } catch (err: any) {
      console.warn('Lỗi tải lịch sử:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Xoá quẻ bói',
      'Bạn có chắc chắn muốn xoá quẻ bói này khỏi lịch sử và xoá ảnh lưu trữ trên mây?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá ngay',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await deleteReadingApi(id, token);
              setItems((prev) => prev.filter((item) => item.id !== id && item._id !== id));
              if (selectedReading?.id === id || selectedReading?._id === id) {
                setSelectedReading(null);
              }
              Alert.alert('Thành công', 'Đã xoá quẻ bói thành công.');
            } catch (err: any) {
              const msg = describeApiError(err, 'Không thể xoá quẻ bói.');
              Alert.alert('Lỗi', msg);
            }
          },
        },
      ]
    );
  };

  if (!token) {
    return (
      <View style={styles.centerContainer}>
        <TarotCard style={styles.authNoticeCard}>
          <Text style={styles.authNoticeIcon}>🔒</Text>
          <Text style={styles.authNoticeTitle}>Yêu Cầu Đăng Nhập</Text>
          <Text style={styles.authNoticeDesc}>
            Vui lòng đăng nhập để lưu trữ và xem lại toàn bộ lịch sử các lần bói chỉ
            tay của bạn.
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={onGoLogin}>
            <Text style={styles.btnPrimaryText}>Đăng Nhập Ngay</Text>
          </TouchableOpacity>
        </TarotCard>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Detail Modal View */}
      {selectedReading ? (
        <View style={styles.detailWrapper}>
          <TarotCard style={styles.detailCard}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setSelectedReading(null)}
            >
              <Text style={styles.backBtnText}>&larr; Quay lại danh sách</Text>
            </TouchableOpacity>

            <Text style={styles.detailTitle}>
              {selectedReading.school} • {selectedReading.hand === 'RIGHT' ? 'Tay Phải' : 'Tay Trái'}
            </Text>
            <Text style={styles.detailDate}>
              Ngày xem: {new Date(selectedReading.createdAt).toLocaleString('vi-VN')}
            </Text>

            {selectedReading.imageUrl && (
              <Image
                source={{ uri: selectedReading.imageUrl }}
                style={styles.detailImage}
                resizeMode="cover"
              />
            )}

            {selectedReading.result?.overview && (
              <View style={styles.subCard}>
                <Text style={styles.subCardTitle}>✨ Tổng Quan Vận Mệnh</Text>
                <Text style={styles.subCardText}>
                  {selectedReading.result.overview}
                </Text>
              </View>
            )}

            {selectedReading.result?.sections &&
              Object.entries(selectedReading.result.sections).map(
                ([k, v]: any) => (
                  <View key={k} style={styles.subCard}>
                    <Text style={styles.subCardTitle}>🔹 {v?.title || k}</Text>
                    <Text style={styles.subCardText}>
                      {v?.description || v?.content || String(v)}
                    </Text>
                  </View>
                )
              )}

            {selectedReading.result?.aspects &&
              Object.entries(selectedReading.result.aspects).map(
                ([k, v]: any) => (
                  <View key={k} style={styles.subCard}>
                    <Text style={styles.subCardTitle}>
                      🌟 {k.toUpperCase()}
                    </Text>
                    <Text style={styles.subCardText}>
                      {v?.description || v?.content || String(v)}
                    </Text>
                  </View>
                )
              )}

            {selectedReading.result?.advice && (
              <View style={[styles.subCard, styles.adviceCard]}>
                <Text style={styles.subCardTitle}>💡 Lời Khuyên Định Hướng</Text>
                <Text style={styles.subCardText}>
                  {selectedReading.result.advice}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.btnDelete}
              onPress={() => handleDelete(selectedReading.id || selectedReading._id)}
            >
              <Text style={styles.btnDeleteText}>🗑️ Xoá Quẻ Bói Này</Text>
            </TouchableOpacity>
          </TarotCard>
        </View>
      ) : (
        /* List View */
        <View>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.badgeTop}>✦ SỔ THIÊN MỆNH</Text>
              <Text style={styles.mainTitle}>Lịch Sử Xem Bói</Text>
            </View>
            <TouchableOpacity
              style={styles.btnNewReading}
              onPress={onGoScan}
              activeOpacity={0.8}
            >
              <Text style={styles.btnNewReadingText}>+ Quẻ Mới</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator
                size="large"
                color={PALMSIGHT_MOBILE_THEME.colors.gold}
              />
              <Text style={styles.loadingText}>Đang tải quẻ bói từ mây...</Text>
            </View>
          ) : items.length === 0 ? (
            <TarotCard style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📜</Text>
              <Text style={styles.emptyTitle}>Chưa có quẻ bói nào</Text>
              <Text style={styles.emptyDesc}>
                Các lần bạn xem bói chỉ tay sẽ được lưu trữ an toàn và xuất hiện
                tại đây.
              </Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={onGoScan}>
                <Text style={styles.btnPrimaryText}>✨ Khai Quẻ Ngay (−1 Credit)</Text>
              </TouchableOpacity>
            </TarotCard>
          ) : (
            <View style={styles.itemsList}>
              {items.map((item) => {
                const id = item.id || item._id;
                const dateStr = new Date(item.createdAt).toLocaleDateString(
                  'vi-VN'
                );
                return (
                  <TouchableOpacity
                    key={id}
                    style={styles.historyItemCard}
                    onPress={() => setSelectedReading(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.itemHeader}>
                      <View style={styles.schoolBadge}>
                        <Text style={styles.schoolBadgeText}>
                          {item.school} • {item.hand === 'RIGHT' ? 'Phải' : 'Trái'}
                        </Text>
                      </View>
                      <Text style={styles.dateText}>{dateStr}</Text>
                    </View>

                    <Text style={styles.overviewSnippet} numberOfLines={3}>
                      {item.result?.overview || 'Đang xử lý quẻ bói...'}
                    </Text>

                    <View style={styles.itemFooter}>
                      <Text style={styles.readMoreText}>Xem chi tiết luận giải &rarr;</Text>
                      <TouchableOpacity
                        onPress={() => handleDelete(id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.deleteIconText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
  centerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authNoticeCard: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  authNoticeIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  authNoticeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 8,
  },
  authNoticeDesc: {
    fontSize: 13,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    paddingBottom: 14,
  },
  badgeTop: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  btnNewReading: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
  },
  btnNewReadingText: {
    color: PALMSIGHT_MOBILE_THEME.colors.canvas,
    fontWeight: '800',
    fontSize: 12,
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
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  itemsList: {
    gap: 12,
  },
  historyItemCard: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  schoolBadge: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
  },
  schoolBadgeText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  dateText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 11,
  },
  overviewSnippet: {
    fontSize: 13,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    lineHeight: 19,
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    paddingTop: 8,
  },
  readMoreText: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteIconText: {
    fontSize: 14,
  },
  detailWrapper: {
    paddingVertical: 10,
  },
  detailCard: {
    padding: 18,
  },
  backBtn: {
    marginBottom: 14,
  },
  backBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 4,
  },
  detailDate: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    marginBottom: 14,
  },
  detailImage: {
    width: '100%',
    height: 220,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    marginBottom: 16,
  },
  subCard: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceSoft,
    padding: 14,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    marginBottom: 12,
  },
  adviceCard: {
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  subCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 6,
  },
  subCardText: {
    fontSize: 13,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    lineHeight: 20,
  },
  btnDelete: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.danger,
    paddingVertical: 12,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  btnDeleteText: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  btnPrimary: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: PALMSIGHT_MOBILE_THEME.colors.canvas,
    fontWeight: '800',
    fontSize: 13,
  },
});
