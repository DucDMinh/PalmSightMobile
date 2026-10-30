import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import {
  ReadingSchool,
  HandOrientation,
  ReadingStatus,
  READING_SCHOOLS,
  READING_SCHOOL_LIST,
  LIFE_ASPECTS,
  ReadingDto,
} from '@palmsight/shared';
import { TarotCard } from '../components/TarotCard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import readingsService from '../services/readingsService';
import { useAuth } from '../providers/AuthenticationProvider';
import { showError, showSuccess } from '../helpers/toast';
import { CACHED_KEYS } from '../consts/cachedKeys';

interface ScanScreenProps {
  onGoHistory: () => void;
  onGoWallet: () => void;
  onGoReadingDetail: (reading: ReadingDto) => void;
  onGoGuestPreview: (claimToken: string) => void;
}

const SCHOOL_SYMBOLS: Record<ReadingSchool, string> = {
  [ReadingSchool.WESTERN]: '☼',
  [ReadingSchool.EASTERN]: '☯',
  [ReadingSchool.VEDIC]: '✦',
};

export const ScanScreen: React.FC<ScanScreenProps> = ({
  onGoHistory,
  onGoWallet,
  onGoReadingDetail,
  onGoGuestPreview,
}) => {
  const { user, isLogged, refreshProfile, setClaimToken } = useAuth();

  // 1. School selection
  const [school, setSchool] = useState<ReadingSchool>(ReadingSchool.EASTERN);

  // 2. Topics selection
  const [isAllTopics, setIsAllTopics] = useState(true);
  const [selectedSections, setSelectedSections] = useState<string[]>(() =>
    READING_SCHOOLS[ReadingSchool.EASTERN].sections.map((s) => s.key)
  );
  const [selectedAspects, setSelectedAspects] = useState<string[]>(() =>
    LIFE_ASPECTS.map((a) => a.key)
  );

  // 3. Hand selection
  const [hand, setHand] = useState<HandOrientation>(HandOrientation.LEFT);

  // 4. Capture & Consent
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [aiConsent, setAiConsent] = useState(true);

  // Flow & State
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load last school on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(CACHED_KEYS.LAST_SCHOOL);
        if (
          saved === ReadingSchool.WESTERN ||
          saved === ReadingSchool.EASTERN ||
          saved === ReadingSchool.VEDIC
        ) {
          handleSelectSchool(saved as ReadingSchool);
        }
      } catch {}
    })();
  }, []);

  // Cycle analyzing messages
  useEffect(() => {
    if (!analyzing) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    const interval = setInterval(() => {
      setAnalyzingStep((prev) => (prev + 1) % 3);
    }, 2800);
    return () => clearInterval(interval);
  }, [analyzing]);

  const handleSelectSchool = (newSchool: ReadingSchool) => {
    setSchool(newSchool);
    setSelectedSections(READING_SCHOOLS[newSchool].sections.map((s) => s.key));
    try {
      SecureStore.setItemAsync(CACHED_KEYS.LAST_SCHOOL, newSchool);
    } catch {}
  };

  // Toggle All Topics
  const handleToggleAll = () => {
    if (isAllTopics) {
      setIsAllTopics(false);
      setSelectedSections([READING_SCHOOLS[school].sections[0].key]);
      setSelectedAspects([LIFE_ASPECTS[0].key]);
    } else {
      setIsAllTopics(true);
      setSelectedSections(READING_SCHOOLS[school].sections.map((s) => s.key));
      setSelectedAspects(LIFE_ASPECTS.map((a) => a.key));
    }
  };

  // Toggle Section
  const handleToggleSection = (key: string) => {
    const allSecKeys = READING_SCHOOLS[school].sections.map((s) => s.key);
    const allAspKeys = LIFE_ASPECTS.map((a) => a.key);

    let nextSections: string[];
    const nextAspects = isAllTopics ? [...allAspKeys] : [...selectedAspects];

    if (isAllTopics) {
      nextSections = allSecKeys.filter((k) => k !== key);
    } else {
      if (selectedSections.includes(key)) {
        nextSections = selectedSections.filter((k) => k !== key);
      } else {
        nextSections = [...selectedSections, key];
      }
    }

    const isAllNow =
      nextSections.length === allSecKeys.length &&
      nextAspects.length === allAspKeys.length;

    setIsAllTopics(isAllNow);
    setSelectedSections(nextSections);
    setSelectedAspects(nextAspects);
  };

  // Toggle Aspect
  const handleToggleAspect = (key: string) => {
    const allSecKeys = READING_SCHOOLS[school].sections.map((s) => s.key);
    const allAspKeys = LIFE_ASPECTS.map((a) => a.key);

    const nextSections = isAllTopics ? [...allSecKeys] : [...selectedSections];
    let nextAspects: string[];

    if (isAllTopics) {
      nextAspects = allAspKeys.filter((k) => k !== key);
    } else {
      if (selectedAspects.includes(key)) {
        nextAspects = selectedAspects.filter((k) => k !== key);
      } else {
        nextAspects = [...selectedAspects, key];
      }
    }

    const isAllNow =
      nextSections.length === allSecKeys.length &&
      nextAspects.length === allAspKeys.length;

    setIsAllTopics(isAllNow);
    setSelectedSections(nextSections);
    setSelectedAspects(nextAspects);
  };

  const isSectionSelected = (key: string) =>
    isAllTopics || selectedSections.includes(key);

  const isAspectSelected = (key: string) =>
    isAllTopics || selectedAspects.includes(key);

  const selectedCount = isAllTopics
    ? READING_SCHOOLS[school].sections.length + LIFE_ASPECTS.length
    : selectedSections.length + selectedAspects.length;

  // Media library pick
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setRejectReason(null);
    }
  };

  // Camera capture
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền camera để chụp ảnh bàn tay.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setRejectReason(null);
    }
  };

  // Start Scan Submit
  const handleStartScan = async () => {
    if (!imageUri) {
      showError('Vui lòng chụp hoặc chọn ảnh lòng bàn tay của bạn.');
      return;
    }
    if (!aiConsent) {
      showError('Bạn cần đồng ý để AI phân tích hình ảnh bàn tay.');
      return;
    }
    if (selectedCount === 0) {
      showError('Vui lòng chọn ít nhất 1 mục để xem bói.');
      return;
    }

    if (isLogged && (user?.creditBalance ?? 0) <= 0) {
      Alert.alert(
        'Không đủ credit',
        'Số dư của bạn là 0 credit. Nhập mã giới thiệu bạn bè (+1) để bói ngay!',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đến Ví / Nhập mã', onPress: onGoWallet },
        ]
      );
      return;
    }

    setAnalyzing(true);
    setRejectReason(null);

    const topicsToSend = isAllTopics
      ? undefined
      : [...selectedSections, ...selectedAspects];

    try {
      if (isLogged) {
        // Member scan
        const res = await readingsService.createReading({
          school,
          hand,
          topics: topicsToSend,
          aiConsent,
          imageUri,
        });

        refreshProfile();

        const reading = res.reading;
        if (reading.status === ReadingStatus.DONE) {
          setAnalyzing(false);
          onGoReadingDetail(reading);
        } else if (reading.status === ReadingStatus.REJECTED) {
          setAnalyzing(false);
          setRejectReason(reading.rejectReason || 'Ảnh không rõ nét hoặc không phải lòng bàn tay.');
        } else {
          // Poll until DONE or REJECTED
          pollReadingStatus(reading.id);
        }
      } else {
        // Guest scan
        const res = await readingsService.createGuestReading({
          school,
          hand,
          topics: topicsToSend,
          aiConsent,
          imageUri,
        });

        setAnalyzing(false);
        const claimToken = res.claimToken || res.reading?.claimToken;
        if (claimToken) {
          setClaimToken(claimToken);
          onGoGuestPreview(claimToken);
        } else {
          showError('Không nhận được mã nhận quẻ bói từ máy chủ.');
        }
      }
    } catch (err: any) {
      setAnalyzing(false);
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Không thể kết nối đến đài chiêm tinh. Vui lòng thử lại sau.';
      showError(msg, 'Bói chỉ tay');
    }
  };

  // Polling for member reading
  const pollReadingStatus = (readingId: string) => {
    let attempts = 0;
    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const latest = await readingsService.getReadingById(readingId);
        if (latest.status === ReadingStatus.DONE) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setAnalyzing(false);
          refreshProfile();
          onGoReadingDetail(latest);
        } else if (latest.status === ReadingStatus.REJECTED) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setAnalyzing(false);
          setRejectReason(latest.rejectReason || 'Ảnh không rõ nét hoặc không phải lòng bàn tay.');
        } else if (latest.status === ReadingStatus.FAILED) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setAnalyzing(false);
          showError('AI không thể hoàn tất bài đọc lúc này. Credits đã được hoàn lại.');
        }
      } catch {
        // Network flutter; keep polling
      }

      if (attempts >= 25) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setAnalyzing(false);
        showError('Hệ thống đang tải dữ liệu chậm. Bạn có thể kiểm tra kết quả tại Lịch sử sau ít phút.');
      }
    }, 2000);
  };

  const analyzingMessages = [
    '🔮 Định vị & chuẩn hóa giải phẫu lòng bàn tay...',
    '✨ Trích xuất đặc trưng các đường chỉ chính & gò hành tinh...',
    '📜 Trí tuệ nhân tạo đang luận giải bài bói theo trường phái...',
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {analyzing ? (
        /* Analyzing Screen */
        <View style={styles.analyzingBox}>
          <TarotCard style={styles.analyzingCard}>
            <View style={styles.pulseContainer}>
              <ActivityIndicator
                size="large"
                color={PALMSIGHT_MOBILE_THEME.colors.gold}
              />
            </View>
            <Text style={styles.analyzingTitle}>ĐANG KHAI QUẺ THIÊN MỆNH</Text>
            <Text style={styles.analyzingDesc}>
              {analyzingMessages[analyzingStep]}
            </Text>
            <Text style={styles.analyzingTip}>
              Quá trình phân tích chuyên sâu mất khoảng 10–25 giây. Vui lòng giữ màn hình sáng.
            </Text>
          </TarotCard>
        </View>
      ) : (
        /* Scan Flow Form */
        <View>
          {/* Header */}
          <View style={styles.headerTitleBox}>
            <Text style={styles.badgeTop}>
              ✦ {isLogged ? 'KHAI QUẺ MỚI (−1 CREDIT)' : 'QUẺ BÓI TRẢI NGHIỆM MIỄN PHÍ'}
            </Text>
            <Text style={styles.mainTitle}>Khám Phá Vận Mệnh</Text>
            <Text style={styles.mainDesc}>
              Khai mở thông điệp vũ trụ qua thuật xem tướng tay cổ xưa kết hợp AI thị giác máy tính.
            </Text>
          </View>

          {/* Reject Reason Notice if previous attempt failed */}
          {rejectReason && (
            <View style={styles.rejectNotice}>
              <Text style={styles.rejectNoticeTitle}>⚠️ Bàn tay chưa hợp lệ</Text>
              <Text style={styles.rejectNoticeText}>{rejectReason}</Text>
            </View>
          )}

          {/* STEP 1: CHỌN TRƯỜNG PHÁI */}
          <View style={styles.stepHeaderRow}>
            <Text style={styles.stepTitle}>1. Chọn Trường Phái</Text>
            <Text style={styles.stepBadge}>✦ Huyền Học</Text>
          </View>

          {READING_SCHOOL_LIST.map((sch) => {
            const isSelected = school === sch.id;
            return (
              <TouchableOpacity
                key={sch.id}
                style={[
                  styles.schoolOption,
                  isSelected && styles.schoolOptionSelected,
                ]}
                onPress={() => handleSelectSchool(sch.id)}
                activeOpacity={0.8}
              >
                <View style={styles.schoolHeader}>
                  <Text
                    style={[
                      styles.schoolName,
                      isSelected && styles.schoolNameSelected,
                    ]}
                  >
                    {isSelected ? '(x) ' : '( ) '}
                    {sch.name}
                  </Text>
                  <Text style={styles.schoolSymbol}>{SCHOOL_SYMBOLS[sch.id]}</Text>
                </View>
                <Text style={styles.schoolDesc}>{sch.description}</Text>
              </TouchableOpacity>
            );
          })}

          {/* STEP 2: CHỌN MỤC BÓI */}
          <View style={[styles.stepHeaderRow, { marginTop: 20 }]}>
            <Text style={styles.stepTitle}>2. Mục Muốn Bói</Text>
            <Text style={styles.stepBadge}>✦ Quẻ Mệnh</Text>
          </View>

          {/* Toggle All Topics */}
          <TouchableOpacity
            style={[
              styles.toggleAllBtn,
              isAllTopics && styles.toggleAllBtnActive,
            ]}
            onPress={handleToggleAll}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleAllText,
                isAllTopics && styles.toggleAllTextActive,
              ]}
            >
              {isAllTopics ? '[x] Bói toàn bộ các mục' : '[ ] Tùy chọn từng mục'}
            </Text>
          </TouchableOpacity>

          {/* Group 1: Đường chỉ & dấu hiệu theo trường phái */}
          <Text style={styles.subGroupTitle}>
            Đường chỉ & dấu hiệu ({READING_SCHOOLS[school].name}):
          </Text>
          <View style={styles.topicsBox}>
            {READING_SCHOOLS[school].sections.map((sec) => {
              const active = isSectionSelected(sec.key);
              return (
                <TouchableOpacity
                  key={sec.key}
                  style={[styles.topicRow, active && styles.topicRowActive]}
                  onPress={() => handleToggleSection(sec.key)}
                >
                  <Text style={[styles.topicCheck, active && styles.topicCheckActive]}>
                    {active ? '[x]' : '[ ]'}
                  </Text>
                  <Text style={[styles.topicLabel, active && styles.topicLabelActive]}>
                    {sec.title || sec.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Group 2: Khía cạnh đời sống */}
          <Text style={styles.subGroupTitle}>Khía cạnh cuộc sống:</Text>
          <View style={styles.aspectsGrid}>
            {LIFE_ASPECTS.map((asp) => {
              const active = isAspectSelected(asp.key);
              return (
                <TouchableOpacity
                  key={asp.key}
                  style={[styles.aspectChip, active && styles.aspectChipActive]}
                  onPress={() => handleToggleAspect(asp.key)}
                >
                  <Text style={[styles.topicCheck, active && styles.topicCheckActive]}>
                    {active ? '[x]' : '[ ]'}
                  </Text>
                  <Text style={[styles.aspectLabel, active && styles.aspectLabelActive]}>
                    {asp.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedCount === 0 && (
            <Text style={styles.warningZero}>[!] Cần chọn ít nhất 1 mục để xem bói.</Text>
          )}

          {/* STEP 3: CHỌN TAY */}
          <View style={[styles.stepHeaderRow, { marginTop: 20 }]}>
            <Text style={styles.stepTitle}>3. Bàn Tay Khám Phá</Text>
            <Text style={styles.stepBadge}>✦ Âm Dương</Text>
          </View>

          <View style={styles.handRow}>
            <TouchableOpacity
              style={[
                styles.handBtn,
                hand === HandOrientation.LEFT && styles.handBtnSelected,
              ]}
              onPress={() => setHand(HandOrientation.LEFT)}
            >
              <Text
                style={[
                  styles.handBtnText,
                  hand === HandOrientation.LEFT && styles.handBtnTextSelected,
                ]}
              >
                {hand === HandOrientation.LEFT ? '(x) ' : '( ) '}Tay trái
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.handBtn,
                hand === HandOrientation.RIGHT && styles.handBtnSelected,
              ]}
              onPress={() => setHand(HandOrientation.RIGHT)}
            >
              <Text
                style={[
                  styles.handBtnText,
                  hand === HandOrientation.RIGHT && styles.handBtnTextSelected,
                ]}
              >
                {hand === HandOrientation.RIGHT ? '(x) ' : '( ) '}Tay phải
              </Text>
            </TouchableOpacity>
          </View>

          {school === ReadingSchool.EASTERN && (
            <View style={styles.easternHint}>
              <Text style={styles.easternHintText}>
                💡 Theo quy tắc Đông phương: Nam xem tay trái, Nữ xem tay phải.
              </Text>
            </View>
          )}

          <Text style={styles.costHint}>
            [i] Chi phí 1 credit, bao trọn mọi mục bạn đã chọn.
          </Text>

          {/* STEP 4: CHỤP / TẢI ẢNH */}
          <View style={[styles.stepHeaderRow, { marginTop: 20 }]}>
            <Text style={styles.stepTitle}>4. Ảnh Lòng Bàn Tay</Text>
            <Text style={styles.stepBadge}>✦ Thị Giác AI</Text>
          </View>

          {imageUri ? (
            <View style={styles.previewBox}>
              <Image source={{ uri: imageUri }} style={styles.previewImg} />
              <View style={styles.previewControls}>
                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={() => setImageUri(null)}
                >
                  <Text style={styles.retakeBtnText}>🔄 Chụp / Chọn lại</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.captureMethods}>
              <TouchableOpacity
                style={styles.cameraBigBtn}
                onPress={handleTakePhoto}
              >
                <Text style={styles.cameraIcon}>📸</Text>
                <Text style={styles.cameraTitle}>Chụp ảnh trực tiếp</Text>
                <Text style={styles.cameraDesc}>
                  Đặt bàn tay mở tự nhiên dưới ánh sáng rõ nét
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.galleryBtn}
                onPress={handlePickImage}
              >
                <Text style={styles.galleryBtnText}>📁 Chọn ảnh từ thư viện</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* AI Consent Checkbox */}
          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setAiConsent(!aiConsent)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, aiConsent && styles.checkboxChecked]}>
              {aiConsent && <Text style={styles.tick}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              Tôi đồng ý cho phép phân tích hình ảnh bàn tay bằng AI theo Điều khoản dịch vụ và Chính sách riêng tư của PalmSight.
            </Text>
          </TouchableOpacity>

          {/* Credit balance warning for members */}
          {isLogged && (user?.creditBalance ?? 0) <= 0 && (
            <View style={styles.outOfCreditBox}>
              <Text style={styles.outOfCreditText}>
                ⚠️ Bạn đang có 0 credit. Nhập mã giới thiệu bạn bè để được tặng ngay 1 credit miễn phí!
              </Text>
              <TouchableOpacity
                style={styles.enterCodeLinkBtn}
                onPress={onGoWallet}
              >
                <Text style={styles.enterCodeLinkText}>Nhập mã nhận credit &rarr;</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Action */}
          <TouchableOpacity
            style={[
              styles.startScanBtn,
              (!imageUri || !aiConsent || selectedCount === 0) &&
                styles.startScanBtnDisabled,
            ]}
            onPress={handleStartScan}
            disabled={!imageUri || !aiConsent || selectedCount === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.startScanBtnText}>
              {isLogged ? '[ BẮT ĐẦU XEM BÓI (−1 CREDIT) ]' : '[ BÓI THỬ MIỄN PHÍ ]'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 48,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
  },
  headerTitleBox: {
    marginBottom: 20,
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
  mainDesc: {
    fontSize: 13,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    marginTop: 4,
    lineHeight: 18,
  },
  rejectNotice: {
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
    borderColor: PALMSIGHT_MOBILE_THEME.colors.danger,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
    marginBottom: 16,
  },
  rejectNoticeTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  rejectNoticeText: {
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 12,
    lineHeight: 18,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  stepBadge: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.goldDim,
    letterSpacing: 1,
  },
  schoolOption: {
    backgroundColor: 'rgba(11, 7, 22, 0.6)',
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 14,
    marginBottom: 10,
  },
  schoolOptionSelected: {
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    shadowColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  schoolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
  },
  schoolNameSelected: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  schoolSymbol: {
    fontSize: 16,
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
  },
  schoolDesc: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    marginTop: 4,
    lineHeight: 16,
  },
  toggleAllBtn: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
    marginBottom: 12,
  },
  toggleAllBtnActive: {
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
  },
  toggleAllText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontWeight: '600',
    fontSize: 14,
  },
  toggleAllTextActive: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: 'bold',
  },
  subGroupTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: PALMSIGHT_MOBILE_THEME.colors.goldDim,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 4,
  },
  topicsBox: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 8,
    marginBottom: 12,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
  },
  topicRowActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  topicCheck: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 8,
  },
  topicCheckActive: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
  },
  topicLabel: {
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 13,
  },
  topicLabelActive: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '600',
  },
  aspectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 10,
    marginBottom: 10,
  },
  aspectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    width: '48%',
  },
  aspectChipActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  aspectLabel: {
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 13,
  },
  aspectLabelActive: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '600',
  },
  warningZero: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  handRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  handBtn: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  handBtnSelected: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
  },
  handBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 14,
    fontWeight: '600',
  },
  handBtnTextSelected: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: 'bold',
  },
  easternHint: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    padding: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  easternHintText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 12,
  },
  costHint: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 12,
    marginBottom: 8,
  },
  previewBox: {
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    marginBottom: 14,
  },
  previewImg: {
    width: '100%',
    height: 240,
  },
  previewControls: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    padding: 10,
    alignItems: 'center',
  },
  retakeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
  },
  retakeBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 13,
    fontWeight: '600',
  },
  captureMethods: {
    gap: 10,
    marginBottom: 14,
  },
  cameraBigBtn: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 24,
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  cameraTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 12,
    marginTop: 2,
  },
  galleryBtn: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  galleryBtnText: {
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
  },
  tick: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  consentText: {
    flex: 1,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 12,
    lineHeight: 18,
  },
  outOfCreditBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: PALMSIGHT_MOBILE_THEME.colors.warning,
    borderWidth: 1,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
    marginVertical: 10,
  },
  outOfCreditText: {
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 13,
    lineHeight: 18,
  },
  enterCodeLinkBtn: {
    marginTop: 6,
  },
  enterCodeLinkText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 13,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  startScanBtn: {
    height: 50,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  startScanBtnDisabled: {
    opacity: 0.45,
  },
  startScanBtnText: {
    color: '#120a21',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  analyzingBox: {
    paddingVertical: 40,
  },
  analyzingCard: {
    alignItems: 'center',
    padding: 28,
  },
  pulseContainer: {
    marginVertical: 20,
  },
  analyzingTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  analyzingDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  analyzingTip: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ScanScreen;
