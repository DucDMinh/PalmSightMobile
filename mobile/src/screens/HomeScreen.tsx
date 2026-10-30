import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { TarotCard } from '../components/TarotCard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { useAuth } from '../providers/AuthenticationProvider';

interface HomeScreenProps {
  onStartReading: () => void;
  onGoAccount: () => void;
  onGoReferral: () => void;
}

const ASCII_WORDMARK = `███ ███ █   █ █ ███ ███ ███ █ █ ███
█ █ █ █ █   ███ █    █  █   █ █  █
███ ███ █   ███ ███  █  █ █ ███  █
█   █ █ █   █ █   █  █  █ █ █ █  █
█   █ █ ███ █ █ ███ ███ ███ █ █  █`;

const FAQ_DATA = [
  {
    question: 'Ảnh của tôi có được lưu không?',
    answer:
      'Máy chủ xử lý ảnh tạm thời trên RAM để phân tích AI và không lưu trữ trên máy chủ hay dịch vụ đám mây nào theo ADR-0010, đảm bảo quyền riêng tư tuyệt đối.',
  },
  {
    question: 'Kết quả có chính xác không?',
    answer:
      'Kết quả mang tính chiêm đoán giải trí và tham khảo dựa trên cổ thư kết hợp AI Vision.',
  },
  {
    question: 'Nếu AI bị lỗi thì sao?',
    answer:
      'Hệ thống tự động hoàn trả 1 credit vào ví của bạn nếu ảnh không đạt yêu cầu hoặc xảy ra lỗi.',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartReading,
}) => {
  const { isLogged } = useAuth();
  const scrollRef = useRef<any>(null);
  const sampleResultYRef = useRef<number>(0);

  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({ 0: true });

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleScrollToSample = () => {
    if (sampleResultYRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({ y: sampleResultYRef.current - 20, animated: true });
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ========================================================
          1. HERO SECTION
         ======================================================== */}
      <View style={styles.heroSection}>
        {/* Top Badge: ✦ Khai Mở Thiên Cơ · Miễn phí 3 credits */}
        <View style={styles.heroPillBadge}>
          <Text style={styles.sparkleIconSmall}>✨</Text>
          <Text style={styles.heroPillBadgeGold}>✦ KHAI MỞ THIÊN CƠ · </Text>
          <Text style={styles.heroPillBadgeText}>Miễn phí 3 credits</Text>
        </View>

        {/* Headline */}
        <Text style={styles.heroTitle}>
          Chụp lòng bàn tay.{'\n'}AI đọc chỉ tay giúp bạn.
        </Text>

        {/* Subtitle */}
        <Text style={styles.heroSubtitle}>
          Chọn phương Tây, phương Đông hoặc Ấn Độ, chụp một tấm ảnh và nhận bài bói
          trong chưa đầy một phút.
        </Text>

        {/* CTA Buttons */}
        <View style={styles.heroCtaGroup}>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={onStartReading}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaIcon}>✨</Text>
            <Text style={styles.btnSecondaryText}>Bắt đầu xem bói</Text>
          </TouchableOpacity>

          {!isLogged && (
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={onStartReading}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaIconDark}>✋</Text>
              <Text style={styles.btnPrimaryText}>Bói thử 1 lần</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={handleScrollToSample}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaIcon}>👁️</Text>
            <Text style={styles.btnSecondaryText}>Xem ví dụ kết quả</Text>
          </TouchableOpacity>
        </View>

        {/* OAuth note */}
        <View style={styles.oauthNoteRow}>
          <Text style={styles.moonIcon}>☽</Text>
          <Text style={styles.oauthNoteText}>
            Đăng nhập bằng Google hoặc Facebook.
          </Text>
        </View>

        {/* 3 Stats Bar */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>3 Cổ Phái</Text>
            <Text style={styles.statLabel}>Đông · Tây · Ấn Độ</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>&lt; 60 Giây</Text>
            <Text style={styles.statLabel}>Thấu thị đường chỉ</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>100% Ẩn Danh</Text>
            <Text style={styles.statLabel}>Không lưu ảnh gốc</Text>
          </View>
        </View>
      </View>

      {/* ========================================================
          ASTROLOGICAL CONSOLE CARD (Đài Chiêm Tinh · Huyền Cơ Điện)
         ======================================================== */}
      <TarotCard style={styles.consoleCard}>
        <View style={styles.consoleTopLine} />

        {/* Console Header */}
        <View style={styles.consoleHeader}>
          <View style={styles.consoleHeaderLeft}>
            <View style={styles.consoleBadgeRow}>
              <Text style={styles.compassIcon}>🧭</Text>
              <Text style={styles.consoleBadgeText}>ĐÀI CHIÊM TINH · HUYỀN CƠ ĐIỆN</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.asciiWordmark}>{ASCII_WORDMARK}</Text>
            </ScrollView>
          </View>

          {/* 4 Palm lines legend */}
          <View style={styles.palmLinesLegend}>
            <View style={styles.lineLegendItem}>
              <View style={[styles.dot, { backgroundColor: '#fb7185' }]} />
              <Text style={styles.legendText}>Tâm Đạo · Tình Duyên</Text>
            </View>
            <View style={styles.lineLegendItem}>
              <View style={[styles.dot, { backgroundColor: '#c084fc' }]} />
              <Text style={styles.legendText}>Trí Đạo · Công Danh</Text>
            </View>
            <View style={styles.lineLegendItem}>
              <View style={[styles.dot, { backgroundColor: '#f5d77f' }]} />
              <Text style={styles.legendText}>Sinh Đạo · Thọ Mệnh</Text>
            </View>
            <View style={styles.lineLegendItem}>
              <View style={[styles.dot, { backgroundColor: '#34d399' }]} />
              <Text style={styles.legendText}>Định Mệnh · Thiên Thời</Text>
            </View>
          </View>
        </View>

        {/* Command bar */}
        <View style={styles.consoleCommandBar}>
          <Text style={styles.consoleCommandText}>
            |  Phương Đông   Tay trái   [Bói toàn bộ]
          </Text>
          <View style={styles.spiritualBadge}>
            <Text style={styles.spiritualBadgeText}>✦ LINH KHÍ HỘI TỤ</Text>
          </View>
        </View>

        {/* Footer info */}
        <View style={styles.consoleFooter}>
          <Text style={styles.consoleFooterText}>
            tab đổi trường phái    enter xem bói
          </Text>
          <Text style={styles.trigramSymbols}>☰ ☱ ☲ ☳ ☴ ☵ ☶ ☷</Text>
        </View>
      </TarotCard>

      {/* ========================================================
          2. HOW IT WORKS (✦ Nghi Thức Khai Mở ✦ Cách hoạt động)
         ======================================================== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionBadge}>✦ NGHI THỨC KHAI MỞ ✦</Text>
          <Text style={styles.sectionTitle}>Cách hoạt động</Text>
          <Text style={styles.sectionSubtitle}>
            Ba bước kết nối cổ thư tướng số và trí tuệ nhân tạo
          </Text>
        </View>

        <View style={styles.cardsStack}>
          {/* Step 1 */}
          <TarotCard style={styles.stepCard} interactive>
            <View style={styles.stepCardTop}>
              <View style={styles.stepIconCircle}>
                <Text style={styles.stepEmoji}>🧭</Text>
              </View>
              <Text style={styles.romanNumeral}>I</Text>
            </View>
            <Text style={styles.stepCardTitle}>[+] Chọn trường phái</Text>
            <Text style={styles.stepCardDesc}>
              Phương Tây, phương Đông hoặc Ấn Độ.
            </Text>
            <Text style={styles.stepCardLore}>
              Định vị hệ quy chiếu huyền học phù hợp với trực giác của bạn.
            </Text>
          </TarotCard>

          {/* Step 2 */}
          <TarotCard style={styles.stepCard} interactive>
            <View style={styles.stepCardTop}>
              <View style={styles.stepIconCircle}>
                <Text style={styles.stepEmoji}>📸</Text>
              </View>
              <Text style={styles.romanNumeral}>II</Text>
            </View>
            <Text style={styles.stepCardTitle}>[+] Chụp lòng bàn tay</Text>
            <Text style={styles.stepCardDesc}>
              Bằng camera hoặc ảnh có sẵn.
            </Text>
            <Text style={styles.stepCardLore}>
              Thấu kính AI quét đường chỉ, gò bàn tay và dấu ấn thiên mệnh.
            </Text>
          </TarotCard>

          {/* Step 3 */}
          <TarotCard style={styles.stepCard} interactive>
            <View style={styles.stepCardTop}>
              <View style={styles.stepIconCircle}>
                <Text style={styles.stepEmoji}>📜</Text>
              </View>
              <Text style={styles.romanNumeral}>III</Text>
            </View>
            <Text style={styles.stepCardTitle}>[+] Nhận bài bói</Text>
            <Text style={styles.stepCardDesc}>
              Quan sát, ý nghĩa và lời khuyên.
            </Text>
            <Text style={styles.stepCardLore}>
              Bản luận giải chi tiết từng đường chỉ và lời khuyên ứng xử.
            </Text>
          </TarotCard>
        </View>
      </View>

      {/* ========================================================
          3. SCHOOLS SECTION (✦ Tam Đại Huyền Phái ✦ Trường phái)
         ======================================================== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionBadge}>✦ TAM ĐẠI HUYỀN PHÁI ✦</Text>
          <Text style={styles.sectionTitle}>Trường phái</Text>
          <Text style={styles.sectionSubtitle}>
            Tinh hoa chiêm đoán tướng tay từ ba nền văn minh cổ đại
          </Text>
        </View>

        <View style={styles.cardsStack}>
          {/* Western */}
          <TarotCard style={styles.schoolCard} interactive>
            <View style={styles.schoolCardArcanaRow}>
              <Text style={styles.schoolArcanaTitle}>ARCANA I · OCCIDENTAL</Text>
              <Text style={styles.schoolArcanaSymbols}>☼ ♈ ♌ ♐</Text>
            </View>
            <View style={styles.schoolIconCircle}>
              <Text style={styles.schoolEmoji}>☀️</Text>
            </View>
            <Text style={styles.schoolCardHeading}>Chỉ tay phương Tây</Text>
            <Text style={styles.schoolCardDesc}>
              Dáng tay 4 nguyên tố, các đường chỉ chính và 7 gò
            </Text>
            <View style={styles.schoolAspectsBox}>
              <Text style={styles.schoolAspectsLabel}>CÁC YẾU TỐ LUẬN GIẢI</Text>
              <Text style={styles.schoolAspectsText}>
                Tình cảm · Trí tuệ · Sinh mệnh · Định mệnh · Danh vọng
              </Text>
            </View>
            <TouchableOpacity
              style={styles.schoolSelectBtn}
              onPress={onStartReading}
              activeOpacity={0.8}
            >
              <Text style={styles.schoolSelectBtnText}>Khám phá quẻ này &rarr;</Text>
            </TouchableOpacity>
          </TarotCard>

          {/* Eastern */}
          <TarotCard style={styles.schoolCard} interactive>
            <View style={styles.schoolCardArcanaRow}>
              <Text style={styles.schoolArcanaTitle}>ARCANA II · ORIENTAL BAGUA</Text>
              <Text style={styles.schoolArcanaSymbols}>☯ ☰ ☷ ☲</Text>
            </View>
            <View style={styles.schoolIconCircle}>
              <Text style={styles.schoolEmoji}>☯️</Text>
            </View>
            <Text style={styles.schoolCardHeading}>Chỉ tay phương Đông</Text>
            <Text style={styles.schoolCardDesc}>
              Dáng tay ngũ hành, Thiên – Nhân – Địa văn, cung bát quái
            </Text>
            <View style={styles.schoolAspectsBox}>
              <Text style={styles.schoolAspectsLabel}>CÁC YẾU TỐ LUẬN GIẢI</Text>
              <Text style={styles.schoolAspectsText}>
                Ngũ hành · Thiên văn · Nhân văn · Địa văn · Bát quái · Các ngón tay
              </Text>
            </View>
            <TouchableOpacity
              style={styles.schoolSelectBtn}
              onPress={onStartReading}
              activeOpacity={0.8}
            >
              <Text style={styles.schoolSelectBtnText}>Khám phá quẻ này &rarr;</Text>
            </TouchableOpacity>
          </TarotCard>

          {/* Vedic */}
          <TarotCard style={styles.schoolCard} interactive>
            <View style={styles.schoolCardArcanaRow}>
              <Text style={styles.schoolArcanaTitle}>ARCANA III · VEDIC HASTAREKHA</Text>
              <Text style={styles.schoolArcanaSymbols}>✦ ♃ ♀ ♄</Text>
            </View>
            <View style={styles.schoolIconCircle}>
              <Text style={styles.schoolEmoji}>✨</Text>
            </View>
            <Text style={styles.schoolCardHeading}>Chỉ tay Ấn Độ</Text>
            <Text style={styles.schoolCardDesc}>
              Gò theo 9 hành tinh, đường chính, dấu hiệu đặc biệt
            </Text>
            <View style={styles.schoolAspectsBox}>
              <Text style={styles.schoolAspectsLabel}>CÁC YẾU TỐ LUẬN GIẢI</Text>
              <Text style={styles.schoolAspectsText}>
                9 hành tinh · Đường chính · Dấu hiệu đặc biệt · Ngón cái
              </Text>
            </View>
            <TouchableOpacity
              style={styles.schoolSelectBtn}
              onPress={onStartReading}
              activeOpacity={0.8}
            >
              <Text style={styles.schoolSelectBtnText}>Khám phá quẻ này &rarr;</Text>
            </TouchableOpacity>
          </TarotCard>
        </View>
      </View>

      {/* ========================================================
          4. SAMPLE RESULT (✦ Cổ Thư Luận Giải Mẫu ✦ Ví dụ kết quả)
         ======================================================== */}
      <View
        style={styles.sectionContainer}
        onLayout={(e) => {
          sampleResultYRef.current = e.nativeEvent.layout.y;
        }}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionBadge}>✦ CỔ THƯ LUẬN GIẢI MẪU ✦</Text>
          <Text style={styles.sectionTitle}>Ví dụ kết quả</Text>
          <Text style={styles.sectionSubtitle}>
            Trích đoạn một bản thiên mệnh được giải mã từ đường chỉ tay
          </Text>
        </View>

        <TarotCard style={styles.sampleResultCard}>
          {/* Header row */}
          <View style={styles.sampleHeaderRow}>
            <View style={styles.sampleBrandBadge}>
              <Text style={styles.sampleBrandBadgeText}>📜 PALMSIGHT(1)</Text>
            </View>
            <View style={styles.sampleSchoolBadge}>
              <Text style={styles.sampleSchoolBadgeText}>Chỉ tay phương Đông</Text>
            </View>
            <View style={styles.sampleHandBadge}>
              <Text style={styles.sampleHandBadgeText}>Tay trái</Text>
            </View>
          </View>

          {/* Summary Box */}
          <View style={styles.sampleSummaryBox}>
            <Text style={styles.sampleSummaryTitle}>Tóm tắt: </Text>
            <Text style={styles.sampleSummaryText}>
              Tay Thổ, thực tế và đáng tin cậy. Tình cảm chân thành, chậm mà chắc.
            </Text>
          </View>

          {/* Section Heading */}
          <Text style={styles.sampleSectionHeading}>✦ Dáng tay ngũ hành</Text>

          {/* 2 Observation & Meaning Boxes */}
          <View style={styles.sampleBoxesGrid}>
            <View style={styles.sampleDetailBox}>
              <View style={styles.detailTitleRow}>
                <Text style={styles.detailIcon}>👁️</Text>
                <Text style={styles.detailTitle}>[+] Quan sát</Text>
              </View>
              <Text style={styles.detailBody}>
                Lòng bàn tay vuông, ngón ngắn và chắc.
              </Text>
            </View>

            <View style={styles.sampleDetailBox}>
              <View style={styles.detailTitleRow}>
                <Text style={styles.detailIcon}>✨</Text>
                <Text style={styles.detailTitle}>[+] Ý nghĩa</Text>
              </View>
              <Text style={styles.detailBody}>
                Tay Thổ: thực tế, đáng tin cậy, làm việc đâu ra đó.
              </Text>
            </View>
          </View>
        </TarotCard>

        <View style={styles.sampleCaptionRow}>
          <Text style={styles.captionStar}>✧</Text>
          <Text style={styles.captionText}>Ví dụ minh hoạ, không phải kết quả thật.</Text>
        </View>
      </View>

      {/* ========================================================
          5. CREDITS SECTION (✦ Linh Thạch Năng Lượng ✦ Credits)
         ======================================================== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionBadge}>✦ LINH THẠCH NĂNG LƯỢNG ✦</Text>
          <Text style={styles.sectionTitle}>Credits</Text>
          <Text style={styles.sectionSubtitle}>
            Cơ chế quy đổi minh bạch, không giới hạn thời gian lưu trữ
          </Text>
        </View>

        <View style={styles.cardsStack}>
          <TarotCard style={styles.creditCard} interactive>
            <View style={styles.creditIconBox}>
              <Text style={styles.creditEmoji}>✨</Text>
            </View>
            <View style={styles.creditContent}>
              <Text style={styles.creditHighlight}>[+] 3 credits</Text>
              <Text style={styles.creditDesc}>khi tạo tài khoản</Text>
            </View>
          </TarotCard>

          <TarotCard style={styles.creditCard} interactive>
            <View style={styles.creditIconBox}>
              <Text style={styles.creditEmoji}>🎁</Text>
            </View>
            <View style={styles.creditContent}>
              <Text style={styles.creditHighlight}>[+] +2 credits</Text>
              <Text style={styles.creditDesc}>
                mỗi khi có người nhập mã giới thiệu của bạn
              </Text>
            </View>
          </TarotCard>

          <TarotCard style={styles.creditCard} interactive>
            <View style={styles.creditIconBox}>
              <Text style={styles.creditEmoji}>💎</Text>
            </View>
            <View style={styles.creditContent}>
              <Text style={styles.creditHighlight}>[+] 1 lần xem = 1 credit</Text>
              <Text style={styles.creditDesc}>, dù chọn bao nhiêu mục</Text>
            </View>
          </TarotCard>
        </View>
      </View>

      {/* ========================================================
          6. FAQ SECTION (✦ Giải Đáp Huyền Cơ ✦ Hỏi đáp)
         ======================================================== */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionBadge}>✦ GIẢI ĐÁP HUYỀN CƠ ✦</Text>
          <Text style={styles.sectionTitle}>Hỏi đáp</Text>
          <Text style={styles.sectionSubtitle}>
            Những thắc mắc thường gặp trước khi bắt đầu nghi thức xem chỉ tay
          </Text>
        </View>

        <View style={styles.faqStack}>
          {FAQ_DATA.map((item, index) => {
            const isOpen = !!openFaq[index];
            return (
              <View
                key={item.question}
                style={[styles.faqItem, isOpen && styles.faqItemOpen]}
              >
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleFaq(index)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqToggleBadge}>
                    <Text style={styles.faqToggleBadgeText}>
                      {isOpen ? '−' : '+'}
                    </Text>
                  </View>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.faqAnswerBox}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* ========================================================
          7. BOTTOM CTA SECTION (✦ Vận Mệnh Trong Lòng Bàn Tay ✦)
         ======================================================== */}
      <TarotCard style={styles.bottomCtaCard}>
        <Text style={styles.bottomCtaBadge}>✦ VẬN MỆNH TRONG LÒNG BÀN TAY ✦</Text>
        <Text style={styles.bottomCtaTitle}>
          Sẵn sàng lắng nghe thông điệp từ những đường chỉ tay của bạn?
        </Text>

        <View style={styles.bottomCtaBtnRow}>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={onStartReading}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaIcon}>✨</Text>
            <Text style={styles.btnSecondaryText}>Bắt đầu xem bói</Text>
          </TouchableOpacity>

          {!isLogged && (
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={onStartReading}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaIconDark}>✋</Text>
              <Text style={styles.btnPrimaryText}>Bói thử 1 lần</Text>
            </TouchableOpacity>
          )}
        </View>
      </TarotCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
    backgroundColor: '#0b0716',
  },

  // 1. Hero Section
  heroSection: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(44, 29, 79, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 16,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  sparkleIconSmall: {
    fontSize: 12,
  },
  heroPillBadgeGold: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroPillBadgeText: {
    color: '#f7e7b4',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 32,
    fontWeight: '800',
    color: '#f5e6c8',
    lineHeight: 38,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: '#d8cbe8',
    marginBottom: 20,
  },
  heroCtaGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },

  // Buttons (Pill shape matching globals.css)
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d4af37',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 243, 209, 0.65)',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#0b0716',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(27, 18, 51, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
  },
  btnSecondaryText: {
    color: '#f5e6c8',
    fontSize: 14,
    fontWeight: '600',
  },
  ctaIcon: {
    fontSize: 14,
  },
  ctaIconDark: {
    fontSize: 14,
  },

  oauthNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 22,
  },
  moonIcon: {
    color: '#d4af37',
    fontSize: 13,
  },
  oauthNoteText: {
    fontSize: 13,
    color: '#9e8cb8',
  },

  // 3 Stats row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.25)',
  },
  statCol: {
    flex: 1,
  },
  statNumber: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 18,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#9e8cb8',
  },

  // Astrological Console Card
  consoleCard: {
    marginTop: 10,
    marginBottom: 28,
    padding: 16,
  },
  consoleTopLine: {
    height: 1,
    backgroundColor: '#d4af37',
    opacity: 0.4,
    marginBottom: 12,
  },
  consoleHeader: {
    marginBottom: 16,
  },
  consoleHeaderLeft: {
    marginBottom: 12,
  },
  consoleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  compassIcon: {
    fontSize: 13,
  },
  consoleBadgeText: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  asciiWordmark: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 10,
    lineHeight: 11,
    color: '#f5d77f',
    fontWeight: '800',
  },
  palmLinesLegend: {
    backgroundColor: 'rgba(11, 7, 22, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  lineLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendText: {
    color: '#d8cbe8',
    fontSize: 12,
  },
  consoleCommandBar: {
    backgroundColor: 'rgba(11, 7, 22, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  consoleCommandText: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    color: '#f7e7b4',
    fontSize: 11,
  },
  spiritualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spiritualBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  consoleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  consoleFooterText: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    color: '#9e8cb8',
    fontSize: 11,
  },
  trigramSymbols: {
    color: 'rgba(212, 175, 55, 0.8)',
    letterSpacing: 3,
    fontSize: 12,
  },

  // Sections Common
  sectionContainer: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.25)',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionBadge: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 26,
    fontWeight: '800',
    color: '#f5e6c8',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#9e8cb8',
  },
  cardsStack: {
    gap: 14,
  },

  // Step Cards (How it works)
  stepCard: {
    padding: 16,
  },
  stepCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 7, 22, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepEmoji: {
    fontSize: 18,
  },
  romanNumeral: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 24,
    fontWeight: '800',
    color: 'rgba(212, 175, 55, 0.45)',
    letterSpacing: 2,
  },
  stepCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 4,
  },
  stepCardDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d8cbe8',
    marginBottom: 6,
  },
  stepCardLore: {
    fontSize: 12,
    color: '#9e8cb8',
    lineHeight: 18,
  },

  // School Cards
  schoolCard: {
    padding: 18,
  },
  schoolCardArcanaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
  },
  schoolArcanaTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#d4af37',
    letterSpacing: 1.5,
  },
  schoolArcanaSymbols: {
    fontSize: 13,
    color: '#f7e7b4',
    letterSpacing: 2,
  },
  schoolIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 7, 22, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  schoolEmoji: {
    fontSize: 20,
  },
  schoolCardHeading: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 22,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 6,
  },
  schoolCardDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: '#d8cbe8',
    marginBottom: 14,
  },
  schoolAspectsBox: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 12,
  },
  schoolAspectsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(212, 175, 55, 0.8)',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  schoolAspectsText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#9e8cb8',
  },
  schoolSelectBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  schoolSelectBtnText: {
    color: '#d4af37',
    fontSize: 13,
    fontWeight: '700',
  },

  // Sample Result Section
  sampleResultCard: {
    padding: 16,
  },
  sampleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
  },
  sampleBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sampleBrandBadgeText: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 12,
    fontWeight: '800',
    color: '#d4af37',
  },
  sampleSchoolBadge: {
    backgroundColor: '#241842',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  sampleSchoolBadgeText: {
    color: '#f7e7b4',
    fontSize: 11,
    fontWeight: '600',
  },
  sampleHandBadge: {
    backgroundColor: 'rgba(11, 7, 22, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  sampleHandBadgeText: {
    color: '#d8cbe8',
    fontSize: 11,
  },
  sampleSummaryBox: {
    backgroundColor: 'rgba(11, 7, 22, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  sampleSummaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f7e7b4',
  },
  sampleSummaryText: {
    fontSize: 14,
    color: '#d8cbe8',
    lineHeight: 21,
  },
  sampleSectionHeading: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 18,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 10,
  },
  sampleBoxesGrid: {
    gap: 10,
  },
  sampleDetailBox: {
    backgroundColor: 'rgba(20, 13, 38, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    padding: 12,
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 13,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f7e7b4',
  },
  detailBody: {
    fontSize: 13,
    color: '#d8cbe8',
    lineHeight: 19,
  },
  sampleCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  captionStar: {
    color: '#d4af37',
    fontSize: 12,
  },
  captionText: {
    fontSize: 12,
    color: '#9e8cb8',
  },

  // Credits Section
  creditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  creditIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(11, 7, 22, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditEmoji: {
    fontSize: 18,
  },
  creditContent: {
    flex: 1,
  },
  creditHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f7e7b4',
    marginBottom: 2,
  },
  creditDesc: {
    fontSize: 13,
    color: '#d8cbe8',
  },

  // FAQ Section
  faqStack: {
    gap: 10,
  },
  faqItem: {
    backgroundColor: 'rgba(20, 13, 38, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    padding: 14,
  },
  faqItemOpen: {
    backgroundColor: '#1b1233',
    borderColor: 'rgba(212, 175, 55, 0.6)',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faqToggleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    backgroundColor: 'rgba(11, 7, 22, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqToggleBadgeText: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#f7e7b4',
  },
  faqAnswerBox: {
    marginTop: 10,
    paddingTop: 10,
    paddingLeft: 36,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  faqAnswerText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#d8cbe8',
  },

  // Bottom CTA Card
  bottomCtaCard: {
    marginTop: 36,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  bottomCtaBadge: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  bottomCtaTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 22,
    fontWeight: '800',
    color: '#f7e7b4',
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: 20,
  },
  bottomCtaBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
});

export default HomeScreen;
