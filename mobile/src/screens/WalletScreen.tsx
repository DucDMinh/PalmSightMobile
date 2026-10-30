import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import accountService from '../services/accountService';
import { formatDate } from '../helpers/common';
import { useAuth } from '../providers/AuthenticationProvider';
import {
  CreditTransactionDto,
  CreditTransactionType,
} from '@palmsight/shared';

interface WalletScreenProps {
  onGoScan: () => void;
  onGoAccount: () => void;
  onGoLogin: () => void;
}

const TYPE_CONFIG: Record<
  CreditTransactionType,
  { label: string; isPositive: boolean }
> = {
  [CreditTransactionType.SIGNUP_BONUS]: {
    label: 'Tặng tân thủ khởi tạo',
    isPositive: true,
  },
  [CreditTransactionType.REFERRAL_BONUS]: {
    label: 'Thưởng mời bạn bè',
    isPositive: true,
  },
  [CreditTransactionType.REFEREE_BONUS]: {
    label: 'Nhập mã giới thiệu',
    isPositive: true,
  },
  [CreditTransactionType.READING_SPEND]: {
    label: 'Khai quẻ xem bói',
    isPositive: false,
  },
  [CreditTransactionType.READING_REFUND]: {
    label: 'Hoàn lại quẻ bói lỗi',
    isPositive: true,
  },
  [CreditTransactionType.ADMIN_ADJUST]: {
    label: 'Hệ thống điều chỉnh',
    isPositive: true,
  },
};

export const WalletScreen: React.FC<WalletScreenProps> = ({
  onGoScan,
  onGoAccount,
  onGoLogin,
}) => {
  const { user, isLogged, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!isLogged) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await accountService.getCreditTransactions();
      setTransactions(data?.items || []);
      refreshProfile();
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLogged, refreshProfile]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  if (!isLogged) {
    return (
      <View style={styles.centerBox}>
        <TarotCard style={styles.promptCard}>
          <Text style={styles.badgeTop}>✦ KHO LINH THẠCH</Text>
          <Text style={styles.promptTitle}>Ví credits</Text>
          <Text style={styles.promptDesc}>
            Đăng nhập để theo dõi số dư credits và quản lý lịch sử biến động giao dịch.
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={onGoLogin}>
            <Text style={styles.btnPrimaryText}>Đăng nhập / Đăng ký</Text>
          </TouchableOpacity>
        </TarotCard>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#d4af37"
        />
      }
    >
      {/* Header */}
      <View style={styles.headerBox}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeStar}>✦</Text>
          <Text style={styles.badgeTop}>KHO LINH THẠCH</Text>
        </View>
        <Text style={styles.mainTitle}>Ví credits</Text>
        <Text style={styles.mainDesc}>
          Quản lý số dư và theo dõi lịch sử nạp/dùng credit.
        </Text>
      </View>

      {/* Large Balance Card */}
      <TarotCard style={styles.balanceCard}>
        <Text style={styles.balanceSubTitle}>SỐ DƯ HIỆN TẠI</Text>
        <Text style={styles.balanceBig}>{user?.creditBalance ?? 0} credits</Text>
        <Text style={styles.balanceNote}>
          Credits không hết hạn. Mỗi lần xem bói tiêu thụ 1 credit.
        </Text>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          {user?.referral?.canEnterCode && (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={onGoAccount}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSecondaryText}>
                Nhập mã giới thiệu (+1)
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={onGoScan}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Xem bói ngay (−1)</Text>
          </TouchableOpacity>
        </View>
      </TarotCard>

      {/* Invite Friends Referral Card */}
      <TarotCard style={styles.referralBannerCard} interactive>
        <Text style={styles.refCardBadge}>🎁 CHIA SẺ NHẬN THƯỞNG</Text>
        <Text style={styles.refCardTitle}>Mời Bạn Bè Nhận Credits</Text>
        <Text style={styles.refCardDesc}>
          Mỗi tài khoản có mã 8 ký tự. Bạn bè nhập mã của bạn: Bạn nhận ngay +2
          credits, bạn bè nhận +1 credit.
        </Text>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={onGoAccount}
          activeOpacity={0.8}
        >
          <Text style={styles.btnPrimaryText}>
            Mời bạn bè nhận thêm credits &rarr;
          </Text>
        </TouchableOpacity>
      </TarotCard>

      {/* Transactions Section */}
      <View style={styles.txHeaderRow}>
        <View style={styles.txHeaderLeft}>
          <Text style={styles.txStar}>✦</Text>
          <Text style={styles.txHeaderTitle}>Lịch sử biến động credits</Text>
        </View>
        <Text style={styles.txCount}>{transactions.length} giao dịch</Text>
      </View>

      {loading ? (
        <View style={styles.txLoading}>
          <ActivityIndicator size="small" color="#d4af37" />
          <Text style={styles.txLoadingText}>Đang tra cứu số dư...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <TarotCard style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Chưa có biến động giao dịch</Text>
          <Text style={styles.emptyDesc}>
            Lịch sử nhận quà đăng ký, nạp credit hoặc xem bói sẽ hiển thị tại đây.
          </Text>
        </TarotCard>
      ) : (
        <View style={styles.txList}>
          {transactions.map((tx) => {
            const cfg = TYPE_CONFIG[tx.type] || {
              label: tx.type,
              isPositive: tx.amount > 0,
            };
            const isPos = tx.amount > 0;
            return (
              <TarotCard key={tx.id} style={styles.txItem} interactive>
                <View style={styles.txRow}>
                  <View style={styles.txMainCol}>
                    <Text style={styles.txTypeLabel}>{cfg.label}</Text>
                    {tx.note ? (
                      <Text style={styles.txDesc} numberOfLines={2}>
                        {tx.note}
                      </Text>
                    ) : null}
                    <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                  </View>

                  <View
                    style={[
                      styles.txAmountBadge,
                      isPos ? styles.txAmountPositive : styles.txAmountNegative,
                    ]}
                  >
                    <Text
                      style={[
                        styles.txAmountText,
                        isPos
                          ? styles.txAmountTextPositive
                          : styles.txAmountTextNegative,
                      ]}
                    >
                      {isPos ? `+${tx.amount}` : tx.amount}
                    </Text>
                  </View>
                </View>
              </TarotCard>
            );
          })}
        </View>
      )}
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
    backgroundColor: '#0b0716',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  promptCard: {
    alignItems: 'center',
    padding: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  badgeStar: {
    color: '#d4af37',
    fontSize: 11,
  },
  badgeTop: {
    fontSize: 11,
    color: '#d4af37',
    letterSpacing: 2,
    fontWeight: '800',
  },
  promptTitle: {
    fontSize: 26,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 10,
  },
  promptDesc: {
    fontSize: 13,
    color: '#d8cbe8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  // Header Box
  headerBox: {
    paddingBottom: 14,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
  },
  mainTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 28,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 4,
  },
  mainDesc: {
    fontSize: 13,
    color: '#9e8cb8',
  },

  // Balance Card
  balanceCard: {
    padding: 20,
    marginBottom: 16,
  },
  balanceSubTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 11,
    fontWeight: '800',
    color: '#c5a059',
    letterSpacing: 1.5,
  },
  balanceBig: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 36,
    fontWeight: '800',
    color: '#f7e7b4',
    marginTop: 6,
    marginBottom: 4,
  },
  balanceNote: {
    fontSize: 12,
    color: '#9e8cb8',
    marginBottom: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // Buttons
  btnPrimary: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 243, 209, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#0b0716',
    fontSize: 13,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: 'rgba(27, 18, 51, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: '#f5e6c8',
    fontSize: 13,
    fontWeight: '600',
  },

  // Referral Card
  referralBannerCard: {
    padding: 18,
    marginBottom: 20,
  },
  refCardBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d4af37',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  refCardTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 20,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 6,
  },
  refCardDesc: {
    fontSize: 13,
    color: '#d8cbe8',
    lineHeight: 19,
    marginBottom: 14,
  },

  // Transactions Header
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
  },
  txHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txStar: {
    color: '#d4af37',
    fontSize: 12,
  },
  txHeaderTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 18,
    fontWeight: '800',
    color: '#f7e7b4',
  },
  txCount: {
    fontSize: 12,
    color: '#9e8cb8',
  },
  txLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  txLoadingText: {
    color: '#9e8cb8',
    fontSize: 12,
    marginTop: 6,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#f7e7b4',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    color: '#9e8cb8',
    fontSize: 12,
    textAlign: 'center',
  },

  txList: {
    gap: 10,
  },
  txItem: {
    padding: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  txMainCol: {
    flex: 1,
  },
  txTypeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f7e7b4',
    marginBottom: 2,
  },
  txDesc: {
    fontSize: 12,
    color: '#d8cbe8',
    marginBottom: 4,
  },
  txDate: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 11,
    color: '#9e8cb8',
  },
  txAmountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  txAmountPositive: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  txAmountNegative: {
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
    borderColor: 'rgba(251, 113, 133, 0.4)',
  },
  txAmountText: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 14,
    fontWeight: '800',
  },
  txAmountTextPositive: {
    color: '#34d399',
  },
  txAmountTextNegative: {
    color: '#fb7185',
  },
});

export default WalletScreen;
