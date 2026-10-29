import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { TarotCard } from '../components/TarotCard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';

interface HomeScreenProps {
  onStartReading: () => void;
  onGoAccount: () => void;
  onGoReferral: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartReading,
  onGoAccount,
  onGoReferral,
}) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.badgeTop}>
          <Text style={styles.badgeTopText}>✦ HUYỀN CƠ CHỈ TAY BẰNG AI VISION</Text>
        </View>

        <Text style={styles.heroTitle}>
          Vận Mệnh Nằm Trong{'\n'}
          <Text style={styles.goldGradientText}>Lòng Bàn Tay Bạn</Text>
        </Text>

        <Text style={styles.heroSubtitle}>
          Kết hợp AI thị giác máy tính nhận diện đường chỉ tay và mô hình ngôn ngữ
          luận giải chuyên sâu theo 3 trường phái cổ truyền.
        </Text>

        <View style={styles.heroCtaRow}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={onStartReading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimaryText}>✨ BÓI CHỈ TAY NGAY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={onGoAccount}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSecondaryText}>🎁 Nhận +3 Credits</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3 Trường Phái Card Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderBadge}>✦ BÁT VĂN CHIÊM ĐOÁN</Text>
        <Text style={styles.sectionTitle}>3 Trường Phái Cổ Truyền</Text>
        <Text style={styles.sectionSub}>
          Chọn trường phái bói phù hợp với mong muốn khám phá của bạn.
        </Text>
      </View>

      <TarotCard style={styles.schoolCard}>
        <View style={styles.schoolTopRow}>
          <Text style={styles.schoolIcon}>🌌</Text>
          <View style={styles.schoolTitleCol}>
            <Text style={styles.schoolName}>Chỉ Tay Phương Tây</Text>
            <Text style={styles.schoolTag}>Chiromancy • 4 Nguyên Tố</Text>
          </View>
        </View>
        <Text style={styles.schoolDesc}>
          Phân tích dáng tay (Đất, Khí, Lửa, Nước), 7 gò hành tinh (Kim Tinh, Mộc
          Tinh, Thổ Tinh...) và các đường chỉ chính: Sinh mệnh, Trí tuệ, Tình cảm,
          Định mệnh.
        </Text>
        <TouchableOpacity style={styles.schoolBtn} onPress={onStartReading}>
          <Text style={styles.schoolBtnText}>Chọn Trường Phái Này &rarr;</Text>
        </TouchableOpacity>
      </TarotCard>

      <TarotCard style={styles.schoolCard}>
        <View style={styles.schoolTopRow}>
          <Text style={styles.schoolIcon}>☯️</Text>
          <View style={styles.schoolTitleCol}>
            <Text style={styles.schoolName}>Chỉ Tay Phương Đông</Text>
            <Text style={styles.schoolTag}>Tam Tài • Ngũ Hành Bát Quái</Text>
          </View>
        </View>
        <Text style={styles.schoolDesc}>
          Thuật tướng số Á Đông luận giải theo Thiên văn (Tình cảm), Nhân văn (Trí
          tuệ), Địa văn (Sinh mệnh), cung Bát quái và dáng tay ngũ hành (Kim, Mộc,
          Thuỷ, Hoả, Thổ).
        </Text>
        <TouchableOpacity style={styles.schoolBtn} onPress={onStartReading}>
          <Text style={styles.schoolBtnText}>Chọn Trường Phái Này &rarr;</Text>
        </TouchableOpacity>
      </TarotCard>

      <TarotCard style={styles.schoolCard}>
        <View style={styles.schoolTopRow}>
          <Text style={styles.schoolIcon}>☸️</Text>
          <View style={styles.schoolTitleCol}>
            <Text style={styles.schoolName}>Chỉ Tay Ấn Độ (Vedic)</Text>
            <Text style={styles.schoolTag}>Samudrika Shastra • Luân Xa</Text>
          </View>
        </View>
        <Text style={styles.schoolDesc}>
          Dựa trên 9 hành tinh thần thoại Ấn Độ (Navagrahas), năng lượng Luân xa
          (Chakras), dấu hiệu thiêng (Cá, Bông sen, Tam giác) và nghiệp lực (Karma).
        </Text>
        <TouchableOpacity style={styles.schoolBtn} onPress={onStartReading}>
          <Text style={styles.schoolBtnText}>Chọn Trường Phái Này &rarr;</Text>
        </TouchableOpacity>
      </TarotCard>

      {/* How it works 4 steps */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderBadge}>✦ BỐN BƯỚC KHAI MỞ</Text>
        <Text style={styles.sectionTitle}>Quy Trình Xem Bói</Text>
      </View>

      <View style={styles.stepsContainer}>
        <View style={styles.stepItem}>
          <View style={styles.stepNumBadge}>
            <Text style={styles.stepNumText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Chọn trường phái</Text>
            <Text style={styles.stepDesc}>
              Phương Tây, Phương Đông hoặc Ấn Độ.
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumBadge}>
            <Text style={styles.stepNumText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Chọn mục muốn xem</Text>
            <Text style={styles.stepDesc}>
              Tích chọn khía cạnh (Tình cảm, Sự nghiệp, Tài chính...) hoặc xem toàn
              bộ.
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumBadge}>
            <Text style={styles.stepNumText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Chụp ảnh lòng bàn tay</Text>
            <Text style={styles.stepDesc}>
              Mở phẳng bàn tay dưới ánh sáng rõ để AI nhận diện nét rõ nhất.
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumBadge}>
            <Text style={styles.stepNumText}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Nhận bài luận giải</Text>
            <Text style={styles.stepDesc}>
              AI viết bài phân tích chuyên sâu chi tiết từng khía cạnh trong vài
              giây.
            </Text>
          </View>
        </View>
      </View>

      {/* Referral Banner */}
      <TarotCard style={styles.referralBanner}>
        <Text style={styles.refBadge}>🎁 CHIA SẺ NHẬN THƯỞNG</Text>
        <Text style={styles.refTitle}>Mời Bạn Bè Nhận Credits</Text>
        <Text style={styles.refDesc}>
          Mỗi tài khoản có mã 8 ký tự. Bạn bè nhập mã của bạn: Bạn nhận ngay +2
          credits, bạn bè nhận +1 credit.
        </Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={onGoReferral}>
          <Text style={styles.btnPrimaryText}>Xem Mã Giới Thiệu Của Bạn &rarr;</Text>
        </TouchableOpacity>
      </TarotCard>

      {/* Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          ⚠️ Miễn trừ trách nhiệm: Kết quả luận giải mang tính giải trí và chiêm
          nghiệm cá nhân, không thay thế tư vấn chuyên môn về y tế, tài chính hay
          pháp lý.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    paddingVertical: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  badgeTop: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
  },
  badgeTopText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 10,
  },
  goldGradientText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  heroSubtitle: {
    fontSize: 13,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  heroCtaRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    paddingVertical: 13,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    shadowColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: {
    color: PALMSIGHT_MOBILE_THEME.colors.canvas,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    paddingVertical: 13,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,
  },
  sectionHeaderBadge: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    marginTop: 2,
  },
  schoolCard: {
    marginBottom: 14,
  },
  schoolTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  schoolIcon: {
    fontSize: 26,
  },
  schoolTitleCol: {
    flex: 1,
  },
  schoolName: {
    fontSize: 17,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  schoolTag: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontWeight: '600',
  },
  schoolDesc: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    lineHeight: 18,
    marginBottom: 12,
  },
  schoolBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  schoolBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  stepsContainer: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceSoft,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    gap: 14,
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  stepNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '800',
    fontSize: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
  },
  stepDesc: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
  },
  referralBanner: {
    marginBottom: 18,
    padding: 18,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
  },
  refBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  refTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginBottom: 6,
  },
  refDesc: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    lineHeight: 18,
    marginBottom: 14,
  },
  disclaimerBox: {
    padding: 12,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.borderSubtle,
  },
  disclaimerText: {
    color: PALMSIGHT_MOBILE_THEME.colors.ash,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
