import React, { useState, useEffect, useRef } from 'react';
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
import { showError } from '../helpers/toast';
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

const ANALYZING_MESSAGES = [
  'Đang khởi tạo linh thức thị giác AI...',
  'Đang thấu thị đường chỉ và các gò bàn tay...',
  'Đang trích xuất cổ thư và soạn bài luận giải...',
];

export const ScanScreen: React.FC<ScanScreenProps> = ({
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

  // Gallery Picker
  const handlePickImage = async () => {
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
          onGoReadingDetail(latest);
        } else if (latest.status === ReadingStatus.REJECTED) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setAnalyzing(false);
          setRejectReason(latest.rejectReason || 'Ảnh không rõ nét hoặc không phải lòng bàn tay.');
        } else if (attempts > 30) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setAnalyzing(false);
          showError('Quá thời gian phân tích. Vui lòng kiểm tra lại trong Sổ Thiên Mệnh.');
        }
      } catch {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setAnalyzing(false);
        showError('Không thể kiểm tra trạng thái quẻ bói.');
      }
    }, 2500);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {analyzing ? (
        /* Analyzing Screen */
        <View style={styles.analyzingWrapper}>
          <TarotCard style={styles.analyzingCard}>
            <View style={styles.oracleHalo}>
              <ActivityIndicator size="large" color="#d4af37" />
            </View>
            <Text style={styles.analyzingTitle}>ĐANG KHAI QUẺ THIÊN MỆNH</Text>
            <Text style={styles.analyzingDesc}>
              {ANALYZING_MESSAGES[analyzingStep]}
            </Text>
            <Text style={styles.analyzingTip}>
              Quá trình phân tích chuyên sâu mất khoảng 10–25 giây. Vui lòng giữ màn hình sáng.
            </Text>
          </TarotCard>
        </View>
      ) : (
        /* Scan Flow Form */
        <View>
          {/* Header Banner */}
          <View style={styles.pageHeader}>
            <View style={styles.headerTopBadge}>
              <Text style={styles.headerTopBadgeIcon}>✨</Text>
              <Text style={styles.headerTopBadgeText}>
                ĐÀI CHIÊM TINH · NGHI THỨC XEM CHỈ TAY
              </Text>
            </View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.pageTitle}>Khởi tạo Quẻ Bói Chỉ Tay</Text>
              <Text style={styles.headerSymbols}>✦ ☽ ☼ ☾ ✦</Text>
            </View>
          </View>

          {/* Reject Notice if any */}
          {rejectReason && (
            <View style={styles.rejectNotice}>
              <Text style={styles.rejectNoticeTitle}>
                ⚠️ Không nhìn rõ lòng bàn tay
              </Text>
              <Text style={styles.rejectNoticeText}>{rejectReason}</Text>
            </View>
          )}

          {/* CARD 1: OPTIONS (Steps 1, 2, 3) */}
          <TarotCard style={styles.formCard}>
            {/* STEP 1: CHỌN TRƯỜNG PHÁI */}
            <View style={styles.stepTitleRow}>
              <View style={styles.stepHeadingGroup}>
                <Text style={styles.stepEmoji}>🧭</Text>
                <Text style={styles.stepHeading}>1. Trường phái</Text>
              </View>
              <Text style={styles.stepRuneBadge}>✦ Huyền Học</Text>
            </View>

            <View style={styles.schoolsList}>
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
                      <Text
                        style={[
                          styles.schoolSymbol,
                          isSelected && styles.schoolSymbolSelected,
                        ]}
                      >
                        {SCHOOL_SYMBOLS[sch.id]}
                      </Text>
                    </View>
                    <Text style={styles.schoolDesc}>{sch.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* STEP 2: CHỌN MỤC BÓI */}
            <View style={[styles.stepTitleRow, { marginTop: 24 }]}>
              <View style={styles.stepHeadingGroup}>
                <Text style={styles.stepEmoji}>✨</Text>
                <Text style={styles.stepHeading}>2. Mục muốn bói</Text>
              </View>
              <Text style={styles.stepRuneBadge}>✦ Quẻ Mệnh</Text>
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
              <Text style={styles.toggleAllCheckbox}>
                {isAllTopics ? '[x] ' : '[ ] '}
              </Text>
              <Text
                style={[
                  styles.toggleAllLabel,
                  isAllTopics && styles.toggleAllLabelActive,
                ]}
              >
                Bói toàn bộ
              </Text>
            </TouchableOpacity>

            {/* Group 1: Đường chỉ & dấu hiệu theo trường phái */}
            <Text style={styles.subGroupHeading}>
              ĐƯỜNG CHỈ & DẤU HIỆU (
              {READING_SCHOOLS[school].name.replace('Chỉ tay ', '').toUpperCase()}
              ):
            </Text>
            <View style={styles.subGroupContainer}>
              {READING_SCHOOLS[school].sections.map((sec) => {
                const active = isSectionSelected(sec.key);
                return (
                  <TouchableOpacity
                    key={sec.key}
                    style={[styles.topicRow, active && styles.topicRowActive]}
                    onPress={() => handleToggleSection(sec.key)}
                  >
                    <Text
                      style={[styles.topicCheck, active && styles.topicCheckActive]}
                    >
                      {active ? '[x] ' : '[ ] '}
                    </Text>
                    <Text
                      style={[styles.topicLabel, active && styles.topicLabelActive]}
                    >
                      {sec.title || sec.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Group 2: Khía cạnh cuộc sống */}
            <Text style={styles.subGroupHeading}>KHÍA CẠNH CUỘC SỐNG</Text>
            <View style={styles.aspectsGrid}>
              {LIFE_ASPECTS.map((asp) => {
                const active = isAspectSelected(asp.key);
                return (
                  <TouchableOpacity
                    key={asp.key}
                    style={[styles.aspectChip, active && styles.aspectChipActive]}
                    onPress={() => handleToggleAspect(asp.key)}
                  >
                    <Text
                      style={[styles.topicCheck, active && styles.topicCheckActive]}
                    >
                      {active ? '[x] ' : '[ ] '}
                    </Text>
                    <Text
                      style={[
                        styles.aspectLabel,
                        active && styles.aspectLabelActive,
                      ]}
                    >
                      {asp.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedCount === 0 && (
              <Text style={styles.warningZero}>[!] Chọn ít nhất 1 mục</Text>
            )}

            {/* STEP 3: CHỌN TAY */}
            <View style={[styles.stepTitleRow, { marginTop: 24 }]}>
              <View style={styles.stepHeadingGroup}>
                <Text style={styles.stepEmoji}>✋</Text>
                <Text style={styles.stepHeading}>3. Tay</Text>
              </View>
              <Text style={styles.stepRuneBadge}>✦ Âm Dương</Text>
            </View>

            <View style={styles.handRow}>
              <TouchableOpacity
                style={[
                  styles.handOption,
                  hand === HandOrientation.LEFT && styles.handOptionSelected,
                ]}
                onPress={() => setHand(HandOrientation.LEFT)}
              >
                <Text
                  style={[
                    styles.handOptionText,
                    hand === HandOrientation.LEFT && styles.handOptionTextSelected,
                  ]}
                >
                  {hand === HandOrientation.LEFT ? '(x) ' : '( ) '}Tay trái
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.handOption,
                  hand === HandOrientation.RIGHT && styles.handOptionSelected,
                ]}
                onPress={() => setHand(HandOrientation.RIGHT)}
              >
                <Text
                  style={[
                    styles.handOptionText,
                    hand === HandOrientation.RIGHT && styles.handOptionTextSelected,
                  ]}
                >
                  {hand === HandOrientation.RIGHT ? '(x) ' : '( ) '}Tay phải
                </Text>
              </TouchableOpacity>
            </View>

            {school === ReadingSchool.EASTERN && (
              <View style={styles.easternHintBox}>
                <Text style={styles.easternHintText}>
                  [i] Nam xem tay trái, nữ xem tay phải.
                </Text>
              </View>
            )}

            <View style={styles.priceDivider}>
              <Text style={styles.priceDividerText}>
                [i] Giá 1 credit, dù chọn bao nhiêu mục
              </Text>
            </View>
          </TarotCard>

          {/* CARD 2: CAPTURE STEP (Step 4) */}
          <TarotCard style={styles.captureCard}>
            <View style={styles.stepTitleRow}>
              <View style={styles.stepHeadingGroup}>
                <Text style={styles.stepEmoji}>📸</Text>
                <Text style={styles.stepHeading}>4. Ảnh lòng bàn tay</Text>
              </View>
              <Text style={styles.stepRuneBadge}>✦ Thị Giác AI</Text>
            </View>

            {/* Wireframe Scanner Visual / Preview Box */}
            <View style={styles.scannerViewport}>
              <View style={styles.scannerTopBadge}>
                <Text style={styles.scannerTopBadgeText}>
                  SCAN AREA // 1080P
                </Text>
              </View>

              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.wireframeContainer}>
                  <Text style={styles.wireframePalm}>✋</Text>
                  <Text style={styles.wireframeSubtext}>
                    Đưa lòng bàn tay vào khung hình
                  </Text>
                </View>
              )}

              <View style={styles.scannerBottomBar}>
                <Text style={styles.scannerMetaText}>FPS: 30.0</Text>
                <Text style={styles.scannerMetaTextCenter}>ALIGN_CENTER</Text>
                <Text style={styles.scannerMetaText}>ISO_AUTO</Text>
              </View>
            </View>

            <Text style={styles.captureInstruction}>
              Đủ sáng, xòe ngón tay, lòng bàn tay hướng thẳng camera.
            </Text>

            {/* Buttons: Retake or Pick / Snap */}
            <View style={styles.captureBtnRow}>
              {imageUri ? (
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => setImageUri(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnIcon}>🔄</Text>
                  <Text style={styles.btnSecondaryText}>Chụp lại / Chọn lại</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnIconDark}>📸</Text>
                    <Text style={styles.btnPrimaryText}>Bật camera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnSecondary}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnIcon}>📁</Text>
                    <Text style={styles.btnSecondaryText}>Chọn ảnh có sẵn</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Consent Box */}
            <TouchableOpacity
              style={styles.consentBox}
              onPress={() => setAiConsent(!aiConsent)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, aiConsent && styles.checkboxChecked]}>
                {aiConsent && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.consentLabel}>
                Tôi đồng ý gửi ảnh lòng bàn tay cho hệ thống AI phân tích
              </Text>
            </TouchableOpacity>

            {/* Insufficient credits notice if 0 */}
            {isLogged && (user?.creditBalance ?? 0) <= 0 && (
              <View style={styles.noCreditBox}>
                <Text style={styles.noCreditTitle}>[!] Hết credits</Text>
                <Text style={styles.noCreditText}>
                  Mời bạn bè nhập mã để nhận 2 credits.
                </Text>
                <TouchableOpacity
                  style={styles.noCreditLinkBtn}
                  onPress={onGoWallet}
                >
                  <Text style={styles.noCreditLinkText}>
                    Đến Ví credits &rarr;
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Big Submit Button */}
            <TouchableOpacity
              style={[
                styles.btnSubmitBig,
                (!imageUri || !aiConsent || selectedCount === 0) &&
                  styles.btnSubmitBigDisabled,
              ]}
              onPress={handleStartScan}
              disabled={!imageUri || !aiConsent || selectedCount === 0}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSubmitBigText}>
                {isLogged
                  ? '[ BẮT ĐẦU XEM BÓI (−1 CREDIT) ]'
                  : '[ BÓI THỬ MIỄN PHÍ ]'}
              </Text>
            </TouchableOpacity>
          </TarotCard>
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

  // Page Header
  pageHeader: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
  },
  headerTopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerTopBadgeIcon: {
    fontSize: 12,
  },
  headerTopBadgeText: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  pageTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 24,
    fontWeight: '800',
    color: '#f7e7b4',
  },
  headerSymbols: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 11,
    color: '#9e8cb8',
    letterSpacing: 2,
  },

  rejectNotice: {
    backgroundColor: 'rgba(76, 5, 25, 0.5)',
    borderWidth: 1,
    borderColor: '#fb7185',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  rejectNoticeTitle: {
    color: '#fb7185',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  rejectNoticeText: {
    color: '#f5e6c8',
    fontSize: 13,
    lineHeight: 18,
  },

  // Form Card
  formCard: {
    marginBottom: 18,
    padding: 16,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 12,
  },
  stepHeadingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepEmoji: {
    fontSize: 15,
  },
  stepHeading: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 18,
    fontWeight: '800',
    color: '#f7e7b4',
  },
  stepRuneBadge: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 10,
    color: '#d4af37',
    letterSpacing: 1,
  },

  // Schools list
  schoolsList: {
    gap: 10,
  },
  schoolOption: {
    backgroundColor: 'rgba(11, 7, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    padding: 14,
  },
  schoolOptionSelected: {
    backgroundColor: 'rgba(44, 29, 79, 0.9)',
    borderColor: '#d4af37',
  },
  schoolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#d8cbe8',
  },
  schoolNameSelected: {
    color: '#f7e7b4',
    fontWeight: '800',
  },
  schoolSymbol: {
    fontSize: 16,
    color: '#9e8cb8',
  },
  schoolSymbolSelected: {
    color: '#d4af37',
  },
  schoolDesc: {
    fontSize: 12,
    color: '#9e8cb8',
    lineHeight: 18,
  },

  // Topics Step
  toggleAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 7, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  toggleAllBtnActive: {
    backgroundColor: 'rgba(44, 29, 79, 0.8)',
    borderColor: 'rgba(212, 175, 55, 0.6)',
  },
  toggleAllCheckbox: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 13,
    color: '#d4af37',
    fontWeight: '800',
  },
  toggleAllLabel: {
    fontSize: 14,
    color: '#d8cbe8',
    fontWeight: '600',
  },
  toggleAllLabelActive: {
    color: '#f7e7b4',
    fontWeight: '800',
  },

  subGroupHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(212, 175, 55, 0.9)',
    letterSpacing: 1.5,
    marginTop: 6,
    marginBottom: 8,
  },
  subGroupContainer: {
    backgroundColor: 'rgba(11, 7, 22, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 12,
    padding: 10,
    gap: 4,
    marginBottom: 12,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  topicRowActive: {
    backgroundColor: 'rgba(36, 24, 66, 0.7)',
  },
  topicCheck: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    color: '#9e8cb8',
    fontSize: 12,
    marginRight: 6,
  },
  topicCheckActive: {
    color: '#d4af37',
    fontWeight: '800',
  },
  topicLabel: {
    fontSize: 13,
    color: '#9e8cb8',
  },
  topicLabelActive: {
    color: '#f7e7b4',
    fontWeight: '600',
  },

  aspectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(11, 7, 22, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  aspectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  aspectChipActive: {
    backgroundColor: 'rgba(36, 24, 66, 0.8)',
  },
  aspectLabel: {
    fontSize: 13,
    color: '#9e8cb8',
  },
  aspectLabelActive: {
    color: '#f7e7b4',
    fontWeight: '600',
  },
  warningZero: {
    color: '#fb7185',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  // Hand Step
  handRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  handOption: {
    flex: 1,
    backgroundColor: 'rgba(11, 7, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  handOptionSelected: {
    backgroundColor: 'rgba(44, 29, 79, 0.85)',
    borderColor: '#d4af37',
  },
  handOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9e8cb8',
  },
  handOptionTextSelected: {
    color: '#f7e7b4',
    fontWeight: '800',
  },
  easternHintBox: {
    backgroundColor: 'rgba(11, 7, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  easternHintText: {
    color: 'rgba(212, 175, 55, 0.9)',
    fontSize: 12,
  },
  priceDivider: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  priceDividerText: {
    fontSize: 12,
    color: '#9e8cb8',
  },

  // Capture Card
  captureCard: {
    padding: 16,
  },
  scannerViewport: {
    height: 240,
    backgroundColor: '#0b0716',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: 14,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scannerTopBadge: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(11, 7, 22, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    zIndex: 10,
  },
  scannerTopBadgeText: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 9,
    color: 'rgba(245, 215, 127, 0.85)',
    letterSpacing: 1.5,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  wireframeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wireframePalm: {
    fontSize: 68,
    color: 'rgba(245, 215, 127, 0.5)',
    marginBottom: 8,
  },
  wireframeSubtext: {
    fontSize: 12,
    color: '#9e8cb8',
  },
  scannerBottomBar: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scannerMetaText: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 9,
    color: 'rgba(212, 175, 55, 0.7)',
  },
  scannerMetaTextCenter: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 9,
    color: 'rgba(247, 231, 180, 0.85)',
  },
  captureInstruction: {
    fontSize: 13,
    color: '#d8cbe8',
    marginBottom: 14,
    lineHeight: 19,
  },
  captureBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d4af37',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  btnPrimaryText: {
    color: '#0b0716',
    fontSize: 13,
    fontWeight: '700',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(27, 18, 51, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  btnSecondaryText: {
    color: '#f5e6c8',
    fontSize: 13,
    fontWeight: '600',
  },
  btnIcon: {
    fontSize: 13,
  },
  btnIconDark: {
    fontSize: 13,
  },

  consentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(11, 7, 22, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.6)',
    backgroundColor: '#0b0716',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#d4af37',
  },
  checkboxTick: {
    color: '#0b0716',
    fontSize: 12,
    fontWeight: '900',
  },
  consentLabel: {
    flex: 1,
    fontSize: 13,
    color: '#d8cbe8',
    lineHeight: 18,
  },

  noCreditBox: {
    backgroundColor: 'rgba(36, 24, 66, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.6)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  noCreditTitle: {
    color: '#f59e0b',
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 4,
  },
  noCreditText: {
    color: '#d8cbe8',
    fontSize: 12,
    marginBottom: 6,
  },
  noCreditLinkBtn: {
    alignSelf: 'flex-start',
  },
  noCreditLinkText: {
    color: '#f7e7b4',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  btnSubmitBig: {
    backgroundColor: '#d4af37',
    borderWidth: 1,
    borderColor: 'rgba(255, 243, 209, 0.65)',
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 5,
  },
  btnSubmitBigDisabled: {
    opacity: 0.45,
  },
  btnSubmitBigText: {
    color: '#0b0716',
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontMono,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Analyzing
  analyzingWrapper: {
    paddingVertical: 40,
  },
  analyzingCard: {
    padding: 32,
    alignItems: 'center',
    textAlign: 'center',
  },
  oracleHalo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(44, 29, 79, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 6,
  },
  analyzingTitle: {
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontSize: 20,
    fontWeight: '800',
    color: '#f7e7b4',
    letterSpacing: 1.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  analyzingDesc: {
    fontSize: 14,
    color: '#d8cbe8',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 20,
  },
  analyzingTip: {
    fontSize: 12,
    color: '#9e8cb8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ScanScreen;
