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
import * as Clipboard from 'expo-clipboard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import accountService from '../services/accountService';
import { formatDate } from '../helpers/common';
import { useAuth } from '../providers/AuthenticationProvider';
import { showSuccess } from '../helpers/toast';
import {
  CreditTransactionDto,
  CreditTransactionType,
} from '@palmsight/shared';
import { MysticButton } from '../components/MysticButton';
import { MysticBadge } from '../components/MysticBadge';

interface WalletScreenProps {
  onGoScan: () => void;
  onGoAccount: () => void;
  onGoLogin: () => void;
}

const TYPE_CONFIG: Record<
  CreditTransactionType,
  { label: string; isPositive: boolean; icon: string }
> = {
  [CreditTransactionType.SIGNUP_BONUS]: {
    label: 'Tặng tân thủ khởi tạo',
    isPositive: true,
    icon: '🎁',
  },
  [CreditTransactionType.REFERRAL_BONUS]: {
    label: 'Thưởng mời bạn bè',
    isPositive: true,
    icon: '👥',
  },
  [CreditTransactionType.REFEREE_BONUS]: {
    label: 'Nhập mã giới thiệu',
    isPositive: true,
    icon: '✨',
  },
  [CreditTransactionType.READING_SPEND]: {
    label: 'Khai quẻ xem bói',
    isPositive: false,
    icon: '🔮',
  },
  [CreditTransactionType.READING_REFUND]: {
    label: 'Hoàn quẻ bói không hợp lệ',
    isPositive: true,
    icon: '↩',
  },
  [CreditTransactionType.ADMIN_ADJUST]: {
    label: 'Hệ thống điều chỉnh',
    isPositive: true,
    icon: '⚙',
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
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

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

  const handleCopyCode = async () => {
    if (!user?.referralCode) return;
    try {
      await Clipboard.setStringAsync(user.referralCode);
      showSuccess(`Đã sao chép mã: ${user.referralCode}`, 'Giới thiệu bạn bè');
    } catch {}
  };

  if (!isLogged) {
    return (
      <View style={styles.centerBox}>
        <TarotCard style={styles.promptCard}>
          <Text style={styles.badgeTop}>✦ KHO LINH THẠCH ✦</Text>
          <Text style={styles.promptTitle}>Ví Credits</Text>
          <Text style={styles.promptDesc}>
            Đăng nhập để nhận 3 credits miễn phí ban đầu, quản lý số dư và chia sẻ mã giới thiệu nhận thêm credits.
          </Text>
          <MysticButton
            title="Đăng nhập / Đăng ký"
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

  const filteredTx = transactions.filter((tx) => {
    if (filterType === 'income') return tx.amount > 0;
    if (filterType === 'expense') return tx.amount < 0;
    return true;
  });

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={PALMSIGHT_MOBILE_THEME.colors.gold}
        />
      }
    >
      {/* 1. BALANCE CARD */}
      <TarotCard style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <MysticBadge label="KHO LINH THẠCH PALMSIGHT" icon="🪙" variant="gold" size="sm" />
          <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceNumberRow}>
          <Text style={styles.balanceValue}>{user?.creditBalance ?? 0}</Text>
          <Text style={styles.balanceUnit}>CREDITS</Text>
        </View>

        <Text style={styles.balanceRuleText}>
          ✦ 1 Credit = 1 lần xem bói đầy đủ · Credits không bao giờ hết hạn
        </Text>

        <View style={styles.balanceActionsRow}>
          <MysticButton
            title="Dùng 1 credit xem bói ngay"
            icon="✨"
            variant="primary"
            size="md"
            onPress={onGoScan}
            style={{ flex: 1 }}
          />
        </View>
      </TarotCard>

      {/* 2. REFERRAL INVITE CARD */}
      <TarotCard style={styles.inviteCard}>
        <View style={styles.inviteHeader}>
          <Text style={styles.inviteRune}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.inviteTitle}>Nhận thêm credits miễn phí</Text>
            <Text style={styles.inviteSubtitle}>
              Mời bạn bè: Bạn nhận +2 credits, người nhập nhận +1 credit ngay lập tức!
            </Text>
          </View>
        </View>

        <View style={styles.codeRow}>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>MÃ CỦA BẠN</Text>
            <Text style={styles.codeValue}>{user?.referralCode || '...'}</Text>
          </View>
          <MysticButton
            title="Sao chép"
            variant="secondary"
            size="sm"
            onPress={handleCopyCode}
          />
        </View>

        <TouchableOpacity
          style={styles.manageReferralLink}
          onPress={onGoAccount}
          activeOpacity={0.7}
        >
          <Text style={styles.manageReferralText}>
            Nhập mã người khác hoặc xem chi tiết chia sẻ →
          </Text>
        </TouchableOpacity>
      </TarotCard>

      {/* 3. TRANSACTION HISTORY */}
      <View style={styles.historySection}>
        <View style={styles.historyHeaderRow}>
          <Text style={styles.historyTitle}>Lịch sử biến động credits</Text>
          <Text style={styles.historyCount}>{transactions.length} giao dịch</Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'all' && styles.filterPillActive]}
            onPress={() => setFilterType('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filterType === 'all' && styles.filterPillTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'income' && styles.filterPillActive]}
            onPress={() => setFilterType('income')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filterType === 'income' && styles.filterPillTextActive]}>
              Nhận được (+)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'expense' && styles.filterPillActive]}
            onPress={() => setFilterType('expense')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filterType === 'expense' && styles.filterPillTextActive]}>
              Chi tiêu (-)
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.txLoadingBox}>
            <ActivityIndicator size="small" color="#d4af37" />
          </View>
        ) : filteredTx.length === 0 ? (
          <TarotCard style={styles.txEmptyCard}>
            <Text style={styles.txEmptyText}>Không có giao dịch nào trong danh mục này.</Text>
          </TarotCard>
        ) : (
          <View style={styles.txList}>
            {filteredTx.map((tx) => {
              const cfg = TYPE_CONFIG[tx.type] || {
                label: tx.note || 'Giao dịch credits',
                isPositive: tx.amount > 0,
                icon: '🪙',
              };
              const isPositive = tx.amount > 0;

              return (
                <TarotCard key={tx.id} style={styles.txCard}>
                  <View style={styles.txCardLeft}>
                    <View
                      style={[
                        styles.txIconBox,
                        isPositive ? styles.txIconBoxPlus : styles.txIconBoxMinus,
                      ]}
                    >
                      <Text style={styles.txIcon}>{cfg.icon}</Text>
                    </View>
                    <View>
                      <Text style={styles.txName}>{cfg.label}</Text>
                      <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.txAmount,
                      isPositive ? styles.txAmountPlus : styles.txAmountMinus,
                    ]}
                  >
                    {isPositive ? `+${tx.amount}` : tx.amount}
                  </Text>
                </TarotCard>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
    gap: 14,
  },
  centerBox: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  promptCard: {
    alignItems: 'center',
    padding: 24,
    width: '100%',
    gap: 12,
  },
  badgeTop: {
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

  // BALANCE CARD
  balanceCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#1f1438',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  refreshIcon: {
    fontSize: 18,
    color: '#d4af37',
  },
  balanceNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 4,
  },
  balanceValue: {
    fontSize: 54,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f7e7b4',
    lineHeight: 60,
  },
  balanceUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: 1.5,
  },
  balanceRuleText: {
    fontSize: 12,
    color: '#d8cbe8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  balanceActionsRow: {
    width: '100%',
  },

  // INVITE CARD
  inviteCard: {
    padding: 16,
    gap: 12,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inviteRune: {
    fontSize: 24,
  },
  inviteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f5e6c8',
  },
  inviteSubtitle: {
    fontSize: 12,
    color: '#9e8cb8',
    marginTop: 2,
    lineHeight: 17,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
  },
  codeLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff3d1',
    letterSpacing: 2,
    marginTop: 2,
  },
  codeBox: {
    justifyContent: 'center',
  },
  manageReferralLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  manageReferralText: {
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // HISTORY SECTION
  historySection: {
    marginTop: 6,
    gap: 10,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f5e6c8',
  },
  historyCount: {
    fontSize: 12,
    color: '#7e6d99',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
  },
  filterPillText: {
    fontSize: 11.5,
    color: '#9e8cb8',
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#f7e7b4',
    fontWeight: '700',
  },

  txLoadingBox: {
    padding: 24,
    alignItems: 'center',
  },
  txEmptyCard: {
    padding: 18,
    alignItems: 'center',
  },
  txEmptyText: {
    fontSize: 12.5,
    color: '#9e8cb8',
  },
  txList: {
    gap: 8,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  txCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  txIconBoxPlus: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  txIconBoxMinus: {
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
    borderColor: 'rgba(251, 113, 133, 0.4)',
  },
  txIcon: {
    fontSize: 16,
  },
  txName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f5e6c8',
  },
  txDate: {
    fontSize: 11,
    color: '#7e6d99',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  txAmountPlus: {
    color: '#34d399',
  },
  txAmountMinus: {
    color: '#fb7185',
  },
});

export default WalletScreen;
