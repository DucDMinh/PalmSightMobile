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
          <TouchableOpacity style={styles.loginBtn} onPress={onGoLogin}>
            <Text style={styles.loginBtnText}>[ ĐĂNG NHẬP / ĐĂNG KÝ ]</Text>
          </TouchableOpacity>
        </TarotCard>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={PALMSIGHT_MOBILE_THEME.colors.gold}
        />
      }
    >
      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.badgeTop}>✦ KHO LINH THẠCH · TÀI CHÍNH</Text>
        <Text style={styles.mainTitle}>Ví credits</Text>
        <Text style={styles.mainDesc}>
          Quản lý số dư và theo dõi chi tiết lịch sử nhận hoặc tiêu thụ credit xem bói.
        </Text>
      </View>

      {/* Large Balance Card */}
      <TarotCard style={styles.balanceCard}>
        <Text style={styles.balanceSubTitle}>SỐ DƯ HIỆN CÓ</Text>
        <Text style={styles.balanceBig}>{user?.creditBalance ?? 0} Credits</Text>
        <Text style={styles.balanceNote}>
          Credits không có hạn sử dụng. Mỗi lần khai quẻ chỉ tay tiêu thụ 1 credit.
        </Text>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionPrimaryBtn}
            onPress={onGoScan}
            activeOpacity={0.85}
          >
            <Text style={styles.actionPrimaryText}>⚡ Xem bói ngay (−1)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionSecondaryBtn}
            onPress={onGoAccount}
            activeOpacity={0.85}
          >
            <Text style={styles.actionSecondaryText}>🎁 Nhận thêm credits</Text>
          </TouchableOpacity>
        </View>
      </TarotCard>

      {/* Transactions Section */}
      <View style={styles.txHeaderRow}>
        <Text style={styles.txHeaderTitle}>✦ Lịch sử biến động credits</Text>
        <Text style={styles.txCount}>{transactions.length} giao dịch</Text>
      </View>

      {loading ? (
        <View style={styles.txLoading}>
          <ActivityIndicator size="small" color={PALMSIGHT_MOBILE_THEME.colors.gold} />
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
        transactions.map((tx) => {
          const cfg = TYPE_CONFIG[tx.type] || {
            label: tx.type,
            isPositive: tx.amount > 0,
          };
          const isPos = tx.amount > 0;
          return (
            <TarotCard key={tx.id} style={styles.txItem}>
              <View style={styles.txRow}>
                <View style={styles.txMainCol}>
                  <Text style={styles.txTypeLabel}>{cfg.label}</Text>
                  {tx.note && (
                    <Text style={styles.txDesc} numberOfLines={2}>
                      {tx.note}
                    </Text>
                  )}
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
        })
      )}
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
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  promptCard: {
    alignItems: 'center',
    padding: 28,
  },
  badgeTop: {
    fontSize: 10,
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 4,
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
  mainTitle: {
    fontSize: 26,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  mainDesc: {
    fontSize: 13,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    marginTop: 4,
    lineHeight: 18,
  },
  balanceCard: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    padding: 20,
    marginBottom: 20,
  },
  balanceSubTitle: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.goldDim,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balanceBig: {
    fontSize: 34,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    marginVertical: 6,
  },
  balanceNote: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    lineHeight: 18,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionPrimaryBtn: {
    flex: 1,
    height: 44,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimaryText: {
    color: '#120a21',
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionSecondaryBtn: {
    flex: 1,
    height: 44,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSecondaryText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 13,
    fontWeight: 'bold',
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  txHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  txCount: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
  },
  txLoading: {
    padding: 24,
    alignItems: 'center',
  },
  txLoadingText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 12,
    marginTop: 6,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 12,
    textAlign: 'center',
  },
  txItem: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    padding: 14,
    marginBottom: 8,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txMainCol: {
    flex: 1,
    marginRight: 10,
  },
  txTypeLabel: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 14,
    fontWeight: '700',
  },
  txDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 12,
    marginTop: 2,
  },
  txDate: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 11,
    marginTop: 4,
  },
  txAmountBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  txAmountTextPositive: {
    color: PALMSIGHT_MOBILE_THEME.colors.success,
  },
  txAmountTextNegative: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
  },
});

export default WalletScreen;
