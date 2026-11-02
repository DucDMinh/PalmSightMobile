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
import { MysticButton } from '../components/MysticButton';
import { MysticBadge } from '../components/MysticBadge';
import { MysticDivider } from '../components/mystic/MysticDivider';

interface HomeScreenProps {
  onStartReading: () => void;
  onGoAccount: () => void;
  onGoReferral: () => void;
}

interface SchoolItem {
  id: 'EASTERN' | 'WESTERN' | 'VEDIC';
  symbol: string;
  name: string;
  subtitle: string;
  desc: string;
  badge: string;
}

const SCHOOLS: SchoolItem[] = [
  {
    id: 'EASTERN',
    symbol: '☯',
    name: 'Phương Đông',
    subtitle: 'Tướng Pháp Lạc Việt & Ngũ Hành',
    desc: 'Phân tích hình thái bàn tay theo Kim - Mộc - Thủy - Hỏa - Thổ, kết hợp luận quẻ âm dương dịch lý cổ điển.',
    badge: 'Phổ biến nhất',
  },
  {
    id: 'WESTERN',
    symbol: '☼',
    name: 'Phương Tây',
    subtitle: 'Chiêm Tinh & Thần Thoại Hy Lạp',
    desc: 'Định vị 7 gò thiên thể (Thái Dương, Kim Tinh, Mộc Tinh...) và các đường chỉ tâm lý học phương Tây.',
    badge: 'Khoa học chiêm tinh',
  },
  {
    id: 'VEDIC',
    symbol: '✦',
    name: 'Ấn Độ (Vedic)',
    subtitle: 'Hastarekha & Nghiệp Quả Luân Hồi',
    desc: 'Cổ thư tướng tay Vệ Đà thấu suốt căn cơ nghiệp quả, thời điểm vận hạn đại hạn và chuyển hóa nội tâm.',
    badge: 'Bí truyền Vệ Đà',
  },
];

const STEPS = [
  {
    num: '01',
    symbol: '🧭',
    title: 'Chọn Cổ Phái & Mục Bói',
    desc: 'Chọn trường phái Đông, Tây hoặc Ấn Độ, tích các khía cạnh công danh, tình duyên, tài lộc hoặc bói toàn diện.',
  },
  {
    num: '02',
    symbol: '📸',
    title: 'Chụp Lòng Bàn Tay',
    desc: 'Đặt tay phẳng, đủ sáng. Hệ thống loại bỏ EXIF bảo mật tuyệt đối và gửi xử lý tức thời trong bộ nhớ RAM.',
  },
  {
    num: '03',
    symbol: '📜',
    title: 'Nhận Bản Đồ & Luận Giải',
    desc: 'AI Vision vẽ đè 4 đường chỉ tay chính và Gemini AI soạn bài luận giải chi tiết theo kinh dịch cổ thư.',
  },
];

const FAQ_DATA = [
  {
    q: 'Ảnh bàn tay của tôi có bị lưu trữ công khai không?',
    a: 'Hoàn toàn không. Ảnh được xoá sạch dữ liệu nhạy cảm (EXIF/GPS) trước khi xử lý, lưu trữ bảo mật trên đám mây mã hoá theo ADR-0011 và bạn có toàn quyền xoá vĩnh viễn bất kỳ lúc nào.',
  },
  {
    q: 'Bản đồ đường chỉ tay AI vẽ hoạt động như thế nào?',
    a: 'Mô hình thị giác máy tính ONNX và MediaPipe nhận diện toạ độ các đường Sinh Đạo, Trí Đạo, Tâm Đạo và Định Mệnh, vẽ trực quan trên chính ảnh của bạn với màu sắc chuẩn xác.',
  },
  {
    q: 'Nếu ảnh không đạt chuẩn hoặc AI bị lỗi thì sao?',
    a: 'Nếu ảnh chụp không rõ ràng hoặc hệ thống AI gặp sự cố, 1 credit sẽ được hoàn trả tự động vào ví của bạn ngay lập tức.',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartReading }) => {
  const { isLogged } = useAuth();
  const scrollRef = useRef<any>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [sampleY, setSampleY] = useState(650);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleScrollToSample = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, sampleY - 30), animated: true });
  };

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. HERO SECTION */}
      <View style={styles.heroSection}>
        <MysticBadge
          label="KHAI MỞ THIÊN CƠ · Tặng 3 Credits Tân Thủ"
          icon="✨"
          variant="gold"
          size="md"
          style={styles.heroBadge}
        />

        <Text style={styles.heroTitle}>
          Chụp lòng bàn tay.{'\n'}AI đọc chỉ tay giúp bạn.
        </Text>

        <Text style={styles.heroSubtitle}>
          Khám phá tương lai qua 3 trường phái cổ thư Đông - Tây - Ấn Độ kết hợp trí tuệ nhân tạo chuyên sâu dưới 60 giây.
        </Text>

        <View style={styles.heroActions}>
          <MysticButton
            title="Khai quẻ xem bói ngay"
            icon="✨"
            variant="primary"
            size="lg"
            onPress={onStartReading}
            fullWidth
          />

          {!isLogged && (
            <MysticButton
              title="Bói thử 1 lần không cần đăng ký"
              icon="✋"
              variant="secondary"
              size="md"
              onPress={onStartReading}
              fullWidth
              style={styles.guestCtaBtn}
            />
          )}

          <TouchableOpacity
            style={styles.sampleLinkBtn}
            onPress={handleScrollToSample}
            activeOpacity={0.7}
          >
            <Text style={styles.sampleLinkIcon}>👁️</Text>
            <Text style={styles.sampleLinkText}>Xem ví dụ bài bói mẫu thực tế</Text>
          </TouchableOpacity>
        </View>

        {/* 3 Stats Pills */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>3 Cổ Phái</Text>
            <Text style={styles.statLbl}>Đông · Tây · Ấn Độ</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>&lt; 60 Giây</Text>
            <Text style={styles.statLbl}>Thấu thị đường chỉ</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>100% Bảo Mật</Text>
            <Text style={styles.statLbl}>Xoá EXIF tự động</Text>
          </View>
        </View>
      </View>

      <MysticDivider symbol="✦ ☽ ☼ ☾ ✦" />

      {/* 2. THREE SCHOOLS (Interactive Cards) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionPreTitle}>✦ TAM ĐẠI CỔ THƯ ✦</Text>
          <Text style={styles.sectionTitle}>Chọn trường phái bói</Text>
          <Text style={styles.sectionDesc}>
            Mỗi trường phái mang lại góc nhìn đa chiều về tính cách, thời vận và nhân duyên.
          </Text>
        </View>

        <View style={styles.schoolsList}>
          {SCHOOLS.map((sch) => (
            <TouchableOpacity
              key={sch.id}
              activeOpacity={0.88}
              onPress={onStartReading}
            >
              <TarotCard style={styles.schoolCard} interactive>
                <View style={styles.schoolCardHeader}>
                  <View style={styles.schoolIconCircle}>
                    <Text style={styles.schoolSymbol}>{sch.symbol}</Text>
                  </View>
                  <View style={styles.schoolTitleCol}>
                    <View style={styles.schoolBadgeRow}>
                      <Text style={styles.schoolCardName}>{sch.name}</Text>
                      <MysticBadge label={sch.badge} icon="✦" variant="purple" size="sm" />
                    </View>
                    <Text style={styles.schoolSubtitle}>{sch.subtitle}</Text>
                  </View>
                </View>
                <Text style={styles.schoolDescText}>{sch.desc}</Text>

                <View style={styles.schoolCardFooter}>
                  <Text style={styles.schoolActionText}>Chọn trường phái này</Text>
                  <Text style={styles.schoolArrow}>→</Text>
                </View>
              </TarotCard>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. HOW IT WORKS (3 Simple Steps) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionPreTitle}>✦ NGHI THỨC KHAI MỞ ✦</Text>
          <Text style={styles.sectionTitle}>Cách thức hoạt động</Text>
          <Text style={styles.sectionDesc}>
            Ba bước đơn giản kết nối giữa tướng số bí truyền và trí tuệ nhân tạo
          </Text>
        </View>

        <View style={styles.stepsList}>
          {STEPS.map((step) => (
            <TarotCard key={step.num} style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{step.num}</Text>
                </View>
                <Text style={styles.stepIcon}>{step.symbol}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
              </View>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </TarotCard>
          ))}
        </View>
      </View>

      {/* 4. SAMPLE READING SHOWCASE */}
      <View
        onLayout={(e) => setSampleY(e.nativeEvent.layout.y)}
        style={styles.section}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionPreTitle}>✦ BẢN ĐỒ HUYỀN CƠ ✦</Text>
          <Text style={styles.sectionTitle}>Ví dụ kết quả thực tế</Text>
          <Text style={styles.sectionDesc}>
            AI trực quan hóa 4 đường chỉ tay chính trên ảnh thực tế và đưa ra luận giải chi tiết
          </Text>
        </View>

        <TarotCard style={styles.sampleCard}>
          {/* Legend chips */}
          <View style={styles.legendGrid}>
            <View style={styles.legendPill}>
              <View style={[styles.legendDot, { backgroundColor: '#fb7185' }]} />
              <Text style={styles.legendLabel}>Tâm Đạo · Tình cảm</Text>
            </View>
            <View style={styles.legendPill}>
              <View style={[styles.legendDot, { backgroundColor: '#c084fc' }]} />
              <Text style={styles.legendLabel}>Trí Đạo · Công danh</Text>
            </View>
            <View style={styles.legendPill}>
              <View style={[styles.legendDot, { backgroundColor: '#f5d77f' }]} />
              <Text style={styles.legendLabel}>Sinh Đạo · Sức khỏe</Text>
            </View>
            <View style={styles.legendPill}>
              <View style={[styles.legendDot, { backgroundColor: '#34d399' }]} />
              <Text style={styles.legendLabel}>Định Mệnh · Thời vận</Text>
            </View>
          </View>

          {/* Sample Text Excerpt */}
          <View style={styles.sampleExcerptBox}>
            <View style={styles.sampleExcerptHeader}>
              <Text style={styles.sampleExcerptRune}>📜</Text>
              <Text style={styles.sampleExcerptTitle}>Trích đoạn luận giải quẻ bói</Text>
            </View>
            <Text style={styles.sampleExcerptQuote}>
              &ldquo;Đường Tâm Đạo xuất phát sâu nét, uốn nhẹ hướng về gò Mộc Tinh biểu thị tâm tính chân thành, trọng nghĩa khí. Gò Thái Dương nở nang dự báo giai đoạn trung niên có quý nhân phù trợ trong sự nghiệp...&rdquo;
            </Text>
          </View>

          <MysticButton
            title="Thử xem quẻ bàn tay của bạn"
            icon="✋"
            variant="primary"
            size="md"
            onPress={onStartReading}
            fullWidth
          />
        </TarotCard>
      </View>

      {/* 5. FAQ SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionPreTitle}>✦ GIẢI ĐÁP THẮC MẮC ✦</Text>
          <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
        </View>

        <View style={styles.faqList}>
          {FAQ_DATA.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => toggleFaq(idx)}
                activeOpacity={0.85}
              >
                <TarotCard style={styles.faqCard}>
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{item.q}</Text>
                    <Text style={styles.faqToggleIcon}>{isOpen ? '−' : '+'}</Text>
                  </View>
                  {isOpen && (
                    <Text style={styles.faqAnswer}>{item.a}</Text>
                  )}
                </TarotCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 6. BOTTOM CTA */}
      <TarotCard style={styles.bottomCtaCard}>
        <Text style={styles.bottomCtaPre}>✦ BẮT ĐẦU HÀNH TRÌNH ✦</Text>
        <Text style={styles.bottomCtaTitle}>Sẵn sàng khai mở vận mệnh?</Text>
        <Text style={styles.bottomCtaDesc}>
          Chỉ mất 60 giây để khám phá những điều thú vị ẩn sau đường vân tay của bạn.
        </Text>
        <MysticButton
          title="Bắt đầu xem bói ngay"
          icon="✨"
          variant="primary"
          size="lg"
          onPress={onStartReading}
          fullWidth
        />
      </TarotCard>

      <Text style={styles.disclaimerText}>
        * Quẻ bói chỉ tay mang tính chất chiêm đoán giải trí và khám phá cổ thư văn hoá.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
  },

  // HERO
  heroSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  heroBadge: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14.5,
    color: '#d8cbe8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  heroActions: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  guestCtaBtn: {
    marginTop: 4,
  },
  sampleLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 2,
  },
  sampleLinkIcon: {
    fontSize: 14,
  },
  sampleLinkText: {
    fontSize: 13.5,
    color: '#d4af37',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // STATS
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginTop: 24,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 14,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f7e7b4',
    marginBottom: 3,
  },
  statLbl: {
    fontSize: 10,
    color: '#9e8cb8',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },

  // SECTION GENERAL
  section: {
    marginVertical: 18,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionPreTitle: {
    fontSize: 10.5,
    color: '#d4af37',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
    marginBottom: 6,
    textAlign: 'center',
  },
  sectionDesc: {
    fontSize: 13,
    color: '#9e8cb8',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },

  // SCHOOLS
  schoolsList: {
    gap: 14,
  },
  schoolCard: {
    padding: 16,
  },
  schoolCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  schoolIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolSymbol: {
    fontSize: 22,
    color: '#d4af37',
  },
  schoolTitleCol: {
    flex: 1,
  },
  schoolBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  schoolCardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f7e7b4',
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
  },
  schoolSubtitle: {
    fontSize: 11.5,
    color: '#d8cbe8',
    fontWeight: '500',
  },
  schoolDescText: {
    fontSize: 13,
    color: '#9e8cb8',
    lineHeight: 19,
    marginBottom: 12,
  },
  schoolCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
    paddingTop: 10,
  },
  schoolActionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#d4af37',
  },
  schoolArrow: {
    fontSize: 14,
    color: '#d4af37',
  },

  // STEPS
  stepsList: {
    gap: 12,
  },
  stepCard: {
    padding: 16,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0b0716',
  },
  stepIcon: {
    fontSize: 16,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f5e6c8',
    flex: 1,
  },
  stepDesc: {
    fontSize: 13,
    color: '#9e8cb8',
    lineHeight: 19,
    paddingLeft: 36,
  },

  // SAMPLE
  sampleCard: {
    padding: 16,
    gap: 14,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 13, 38, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 9,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#d8cbe8',
    fontWeight: '500',
  },
  sampleExcerptBox: {
    backgroundColor: 'rgba(27, 18, 51, 0.9)',
    borderLeftWidth: 3,
    borderLeftColor: '#d4af37',
    padding: 14,
    borderRadius: 6,
  },
  sampleExcerptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sampleExcerptRune: {
    fontSize: 14,
  },
  sampleExcerptTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: 0.5,
  },
  sampleExcerptQuote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#f5e6c8',
    lineHeight: 20,
  },

  // FAQ
  faqList: {
    gap: 10,
  },
  faqCard: {
    padding: 14,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f7e7b4',
    flex: 1,
    paddingRight: 10,
  },
  faqToggleIcon: {
    fontSize: 18,
    color: '#d4af37',
    fontWeight: '700',
  },
  faqAnswer: {
    fontSize: 13,
    color: '#9e8cb8',
    lineHeight: 19,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
    paddingTop: 10,
  },

  // BOTTOM CTA
  bottomCtaCard: {
    alignItems: 'center',
    padding: 22,
    marginVertical: 14,
    backgroundColor: '#1f1438',
  },
  bottomCtaPre: {
    fontSize: 10,
    color: '#d4af37',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 6,
  },
  bottomCtaTitle: {
    fontSize: 21,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
    textAlign: 'center',
    marginBottom: 6,
  },
  bottomCtaDesc: {
    fontSize: 13,
    color: '#9e8cb8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#6a5885',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});

export default HomeScreen;
