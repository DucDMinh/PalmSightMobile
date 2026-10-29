import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { TarotCard } from '../components/TarotCard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { getCreditTransactionsApi } from '../services/api';

interface WalletScreenProps {
  token: string | null;
  creditBalance: number;
  onGoReferral: () => void;
  onGoScan: () => void;
  onGoLogin: () => void;
}

const TYPE_LABELS: Record<string, { label: string; positive: boolean }> = {
  SIGNUP_BONUS: { label: 'Tặng khi tạo tài khoản', positive: true },
  READING_SPEND: { label: 'Xem bói chỉ tay', positive: false },
  READING_REFUND: { label: 'Hoàn trả lượt xem bói', positive: true },
  REFERRAL_BONUS: { label: 'Thưởng giới thiệu bạn bè', positive: true },
  REFEREE_BONUS: { label: 'Thưởng nhập mã bạn bè', positive: true },
  ADMIN_ADJUST: { label: 'Điều chỉnh hệ thống', positive: true },
};

export const WalletScreen: React.FC<WalletScreenProps> = ({
  token,
  creditBalance,
  onGoReferral,
  onGoScan,
  onGoLogin,
}) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getCreditTransactionsApi(token);
        setTransactions(data?.items || []);
      } catch (err: any) {
        console.warn('Lỗi tải giao dịch:', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (!token) {
    return (
      <View style={styles.centerContainer}>
        <TarotCard style={styles.authNoticeCard}>
          <Text style={styles.authNoticeIcon}>🪙</Text>
          <Text style={styles.authNoticeTitle}>Ví Credits Của Bạn</Text>
          <Text style={styles.authNoticeDesc}>
            Vui lòng đăng nhập để kiểm tra số dư và theo dõi lịch sử biến động sổ
            cái credits.
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
      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.badgeTop}>✦ KHO LINH THẠCH</Text>
        <Text style={styles.mainTitle}>Ví Credits</Text>
        <Text style={styles.mainDesc}>
          Quản lý số dư và theo dõi minh bạch từng biến động sổ cái.
        </Text>
      </View>

      {/* Balance Big Card */}
      <TarotCard style={styles.balanceCard}>
        <Text style={styles.balanceSubtitle}>SỐ DƯ HIỆN TẠI</Text>
        <Text style={styles.balanceAmount}>{creditBalance} credits</Text>
        <Text style={styles.balanceNote}>
          Credits không bao giờ hết hạn. Mỗi lần bói tốn 1 credit.
        </Text>

        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={onGoScan}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimaryText}>✨ Xem Bói Ngay (−1)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={onGoReferral}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSecondaryText}>🎁 Nhận Thêm (+2)</Text>
          </TouchableOpacity>
        </View>
      </TarotCard>

      {/* Transactions Section */}
      <View style={styles.transHeaderRow}>
        <Text style={styles.transHeaderTitle}>Lịch Sử Biến Động Credits</Text>
        <Text style={styles.transCountText}>{transactions.length} giao dịch</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator
            size="small"
            color={PALMSIGHT_MOBILE_THEME.colors.gold}
          />
          <Text style={styles.loadingText}>Đang đọc sổ cái...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <TarotCard style={styles.emptyTransCard}>
          <Text style={styles.emptyTransText}>
            Chưa có giao dịch biến động credits nào.
          </Text>
        </TarotCard>
      ) : (
        <View style={styles.transList}>
          {transactions.map((t) => {
            const id = t.id || t._id;
            const meta = TYPE_LABELS[t.type] || {
              label: t.type,
              positive: t.amount > 0,
            };
            const isPos = t.amount > 0;
            const sign = isPos ? '+' : '';
            const dateStr = new Date(t.createdAt).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });

            return (
              <View key={id} style={styles.transItem}>
                <View style={styles.transLeft}>
                  <Text style={styles.transLabel}>{meta.label}</Text>
                  <Text style={styles.transDate}>{dateStr}</Text>
                </View>

                <View style={styles.transRight}>
                  <Text
                    style={[
                      styles.transAmount,
                      isPos ? styles.amountPositive : styles.amountNegative,
                    ]}
                  >
                    {sign}
                    {t.amount}
                  </Text>
                  {t.balanceAfter !== undefined && (
                    <Text style={styles.transBalanceAfter}>
                      Dư: {t.balanceAfter}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
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
    padding: 26,
    alignItems: 'center',
    width: '100%',
  },
  authNoticeIcon: {
    fontSize: 40,
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
  headerBox: {
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
    fontSize: 24,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  mainDesc: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    marginTop: 4,
  },
  balanceCard: {
    padding: 22,
    marginBottom: 24,
  },
  balanceSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    letterSpacing: 1.2,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginVertical: 6,
  },
  balanceNote: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    marginBottom: 18,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    paddingVertical: 12,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: PALMSIGHT_MOBILE_THEME.colors.canvas,
    fontWeight: '800',
    fontSize: 13,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    paddingVertical: 12,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '700',
    fontSize: 13,
  },
  transHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  transCountText: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 12,
  },
  emptyTransCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTransText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 13,
  },
  transList: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    overflow: 'hidden',
  },
  transItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALMSIGHT_MOBILE_THEME.colors.borderSubtle,
  },
  transLeft: {
    flex: 1,
  },
  transLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    marginBottom: 2,
  },
  transDate: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
  },
  transRight: {
    alignItems: 'flex-end',
  },
  transAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  amountPositive: {
    color: PALMSIGHT_MOBILE_THEME.colors.success,
  },
  amountNegative: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
  },
  transBalanceAfter: {
    fontSize: 10,
    color: PALMSIGHT_MOBILE_THEME.colors.ash,
    marginTop: 2,
  },
});
