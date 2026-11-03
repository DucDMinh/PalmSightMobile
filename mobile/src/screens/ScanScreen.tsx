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
  PalmLineDto,
} from '@palmsight/shared';
import { TarotCard } from '../components/TarotCard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import readingsService from '../services/readingsService';
import palmLineInferenceService from '../services/palmLineInferenceService';
import { useAuth } from '../providers/AuthenticationProvider';
import { showError } from '../helpers/toast';
import { CACHED_KEYS } from '../consts/cachedKeys';
import { MysticButton } from '../components/MysticButton';
import { MysticBadge } from '../components/MysticBadge';

interface ScanScreenProps {
  onGoHistory: () => void;
  onGoWallet: () => void;
  onGoReadingDetail: (reading: ReadingDto) => void;
  onGoGuestPreview: (claimToken: string) => void;
}

const SCHOOL_SYMBOLS: Record<ReadingSchool, string> = {
  [ReadingSchool.EASTERN]: '☯',
  [ReadingSchool.WESTERN]: '☼',
  [ReadingSchool.VEDIC]: '✦',
};

const ASPECT_ICONS: Record<string, string> = {
  career: '💼',
  love: '💖',
  finance: '💰',
  health: '🌿',
  family: '🏡',
  personality: '✨',
};

const ANALYZING_MESSAGES = [
  'Đang khởi tạo linh thức thị giác AI trên thiết bị...',
  'Đang trích xuất toạ độ 3 đường chỉ tay chính...',
  'Đang kết nối thần điện và soạn bài luận giải...',
];

export const ScanScreen: React.FC<ScanScreenProps> = ({
  onGoWallet,
  onGoReadingDetail,
  onGoGuestPreview,
}) => {
  const { user, isLogged, refreshProfile, setClaimToken } = useAuth();

  // Wizard Step: 1 = School, 2 = Topics, 3 = Hand & Capture
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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

  // 3. Hand & Photo
  const [hand, setHand] = useState<HandOrientation>(HandOrientation.LEFT);
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
      Alert.alert('Quyền truy cập Camera', 'Vui lòng cấp quyền camera trong cài đặt để chụp ảnh bàn tay.');
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
        'Số dư của bạn là 0 credit. Mời bạn bè (+2 credits) hoặc nhập mã giới thiệu (+1 credit) để bói ngay!',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đến Ví / Nhập mã', onPress: onGoWallet },
        ]
      );
      return;
    }

    setAnalyzing(true);
    setRejectReason(null);

    // On-Device AI inference: trích xuất toạ độ đường chỉ tay trước khi gửi lên server
    let extractedPalmLines: PalmLineDto[] | undefined;
    try {
      extractedPalmLines = await palmLineInferenceService.runInference(imageUri);
      if (extractedPalmLines && extractedPalmLines.length > 0) {
        console.log(`[ScanScreen] On-device ONNX inference thành công: ${extractedPalmLines.length} đường.`);
      }
    } catch (inferErr) {
      console.warn('[ScanScreen] On-device ONNX inference bỏ qua hoặc lỗi, server/canonical fallback:', inferErr);
    }

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
          palmLines: extractedPalmLines,
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
          palmLines: extractedPalmLines,
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

  if (analyzing) {
    return (
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
    );
  }

  return (
    <View style={styles.screenWrapper}>
      {/* WIZARD STEP HEADER */}
      <View style={styles.stepProgressBar}>
        <TouchableOpacity
          style={[styles.stepTab, currentStep === 1 && styles.stepTabActive]}
          onPress={() => setCurrentStep(1)}
          activeOpacity={0.8}
        >
          <View style={[styles.stepNumPill, currentStep === 1 && styles.stepNumPillActive]}>
            <Text style={[styles.stepNumText, currentStep === 1 && styles.stepNumTextActive]}>
              1
            </Text>
          </View>
          <Text style={[styles.stepTabTitle, currentStep === 1 && styles.stepTabTitleActive]}>
            Cổ Phái
          </Text>
        </TouchableOpacity>

        <View style={styles.stepConnector} />

        <TouchableOpacity
          style={[styles.stepTab, currentStep === 2 && styles.stepTabActive]}
          onPress={() => setCurrentStep(2)}
          activeOpacity={0.8}
        >
          <View style={[styles.stepNumPill, currentStep === 2 && styles.stepNumPillActive]}>
            <Text style={[styles.stepNumText, currentStep === 2 && styles.stepNumTextActive]}>
              2
            </Text>
          </View>
          <Text style={[styles.stepTabTitle, currentStep === 2 && styles.stepTabTitleActive]}>
            Mục Bói
          </Text>
        </TouchableOpacity>

        <View style={styles.stepConnector} />

        <TouchableOpacity
          style={[styles.stepTab, currentStep === 3 && styles.stepTabActive]}
          onPress={() => setCurrentStep(3)}
          activeOpacity={0.8}
        >
          <View style={[styles.stepNumPill, currentStep === 3 && styles.stepNumPillActive]}>
            <Text style={[styles.stepNumText, currentStep === 3 && styles.stepNumTextActive]}>
              3
            </Text>
          </View>
          <Text style={[styles.stepTabTitle, currentStep === 3 && styles.stepTabTitleActive]}>
            Chụp Ảnh
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* REJECT WARNING BANNER */}
        {rejectReason && (
          <View style={styles.rejectNotice}>
            <Text style={styles.rejectNoticeTitle}>⚠️ Không nhận diện được bàn tay</Text>
            <Text style={styles.rejectNoticeText}>{rejectReason}</Text>
            <Text style={styles.rejectNoticeSub}>
              Hệ thống đã tự động hoàn trả 1 credit vào ví của bạn. Vui lòng chụp lại ảnh rõ nét.
            </Text>
          </View>
        )}

        {/* STEP 1: CHỌN TRƯỜNG PHÁI */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerPreTitle}>✦ BƯỚC 1 TRÊN 3 ✦</Text>
              <Text style={styles.headerTitle}>Chọn Trường Phái Bói</Text>
              <Text style={styles.headerSub}>
                Mỗi cổ phái có phương pháp luận giải và triết lý tướng số riêng biệt.
              </Text>
            </View>

            <View style={styles.schoolsList}>
              {READING_SCHOOL_LIST.map((sch) => {
                const isSelected = school === sch.id;
                return (
                  <TouchableOpacity
                    key={sch.id}
                    onPress={() => handleSelectSchool(sch.id)}
                    activeOpacity={0.85}
                  >
                    <TarotCard
                      style={[
                        styles.schoolOptionCard,
                        isSelected && styles.schoolOptionCardSelected,
                      ]}
                      interactive
                    >
                      <View style={styles.schoolCardTop}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.schoolSymbolGlyph}>
                          {SCHOOL_SYMBOLS[sch.id]}
                        </Text>
                        <View style={styles.schoolTextCol}>
                          <Text
                            style={[
                              styles.schoolName,
                              isSelected && styles.schoolNameSelected,
                            ]}
                          >
                            {sch.name}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.schoolDesc}>{sch.description}</Text>
                    </TarotCard>
                  </TouchableOpacity>
                );
              })}
            </View>

            <MysticButton
              title="Tiếp tục: Chọn mục muốn bói →"
              variant="primary"
              size="lg"
              onPress={() => setCurrentStep(2)}
              fullWidth
              style={styles.stepNextBtn}
            />
          </View>
        )}

        {/* STEP 2: CHỌN MỤC BÓI */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerPreTitle}>✦ BƯỚC 2 TRÊN 3 ✦</Text>
              <Text style={styles.headerTitle}>Chọn Các Mục Muốn Bói</Text>
              <Text style={styles.headerSub}>
                Tất cả các mục được phân tích trong cùng 1 lần bói (chi phí cố định 1 credit).
              </Text>
            </View>

            {/* Quick Toggle: All vs Custom */}
            <TouchableOpacity
              style={[styles.allToggleCard, isAllTopics && styles.allToggleCardActive]}
              onPress={handleToggleAll}
              activeOpacity={0.85}
            >
              <View style={styles.allToggleLeft}>
                <View
                  style={[
                    styles.checkboxBox,
                    isAllTopics && styles.checkboxBoxChecked,
                  ]}
                >
                  {isAllTopics && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <View>
                  <Text style={styles.allToggleTitle}>
                    ✦ Bói toàn bộ (Khuyên dùng)
                  </Text>
                  <Text style={styles.allToggleSubtitle}>
                    Luận giải đầy đủ tất cả các phương diện cuộc đời và cổ thư
                  </Text>
                </View>
              </View>
              <MysticBadge
                label={`${selectedCount} mục`}
                variant={isAllTopics ? 'gold' : 'mute'}
                size="sm"
              />
            </TouchableOpacity>

            {/* Aspect Chips */}
            <View style={styles.categorySection}>
              <Text style={styles.categoryTitle}>Các khía cạnh cuộc sống</Text>
              <View style={styles.chipsWrap}>
                {LIFE_ASPECTS.map((asp) => {
                  const isChecked = isAspectSelected(asp.key);
                  return (
                    <TouchableOpacity
                      key={asp.key}
                      style={[styles.topicChip, isChecked && styles.topicChipActive]}
                      onPress={() => handleToggleAspect(asp.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.topicChipIcon}>
                        {ASPECT_ICONS[asp.key] || '✦'}
                      </Text>
                      <Text
                        style={[
                          styles.topicChipText,
                          isChecked && styles.topicChipTextActive,
                        ]}
                      >
                        {asp.label}
                      </Text>
                      {isChecked && <Text style={styles.chipCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* School-specific sections */}
            <View style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                Đặc trưng riêng · {READING_SCHOOLS[school].name}
              </Text>
              <View style={styles.chipsWrap}>
                {READING_SCHOOLS[school].sections.map((sec) => {
                  const isChecked = isSectionSelected(sec.key);
                  return (
                    <TouchableOpacity
                      key={sec.key}
                      style={[styles.topicChip, isChecked && styles.topicChipActive]}
                      onPress={() => handleToggleSection(sec.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.topicChipIcon}>📜</Text>
                      <Text
                        style={[
                          styles.topicChipText,
                          isChecked && styles.topicChipTextActive,
                        ]}
                      >
                        {sec.label}
                      </Text>
                      {isChecked && <Text style={styles.chipCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.dualNavButtons}>
              <MysticButton
                title="← Quay lại"
                variant="secondary"
                size="md"
                onPress={() => setCurrentStep(1)}
                style={{ flex: 1 }}
              />
              <MysticButton
                title="Chụp ảnh →"
                variant="primary"
                size="md"
                onPress={() => setCurrentStep(3)}
                style={{ flex: 1.6 }}
              />
            </View>
          </View>
        )}

        {/* STEP 3: BÀN TAY & CHỤP ẢNH */}
        {currentStep === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerPreTitle}>✦ BƯỚC 3 TRÊN 3 ✦</Text>
              <Text style={styles.headerTitle}>Chọn Tay & Chụp Ảnh</Text>
              <Text style={styles.headerSub}>
                Chụp ảnh rõ nét lòng bàn tay dưới ánh sáng đủ và phẳng ngón tay.
              </Text>
            </View>

            {/* Hand Toggle */}
            <TarotCard style={styles.handCard}>
              <Text style={styles.handCardTitle}>Chọn bàn tay muốn xem</Text>
              <View style={styles.handSegmented}>
                <TouchableOpacity
                  style={[
                    styles.handOption,
                    hand === HandOrientation.LEFT && styles.handOptionActive,
                  ]}
                  onPress={() => setHand(HandOrientation.LEFT)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.handEmoji}>✋</Text>
                  <Text
                    style={[
                      styles.handText,
                      hand === HandOrientation.LEFT && styles.handTextActive,
                    ]}
                  >
                    Tay Trái
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.handOption,
                    hand === HandOrientation.RIGHT && styles.handOptionActive,
                  ]}
                  onPress={() => setHand(HandOrientation.RIGHT)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.handEmoji}>✋</Text>
                  <Text
                    style={[
                      styles.handText,
                      hand === HandOrientation.RIGHT && styles.handTextActive,
                    ]}
                  >
                    Tay Phải
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.handTip}>
                * Cổ nhân khuyên: &quot;Nam tả Nữ hữu&quot; hoặc chọn bàn tay thuận chính của bạn.
              </Text>
            </TarotCard>

            {/* Photo Capture Zone */}
            <TarotCard style={styles.captureCard}>
              {imageUri ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <View style={styles.imageOverlayBar}>
                    <MysticBadge label="Ảnh đã chọn" icon="✓" variant="emerald" size="sm" />
                    <TouchableOpacity
                      style={styles.retakeBtn}
                      onPress={handleTakePhoto}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.retakeText}>Chụp lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.retakeBtn}
                      onPress={handlePickImage}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.retakeText}>Đổi ảnh khác</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.noPhotoBox}>
                  <View style={styles.palmGuideFrame}>
                    <Text style={styles.guidePalmIcon}>✋</Text>
                    <Text style={styles.guideInstruction}>
                      Đặt lòng bàn tay mở rộng, các ngón tay duỗi thẳng, hướng camera vuông góc với lòng bàn tay.
                    </Text>
                  </View>

                  <View style={styles.photoActionsRow}>
                    <TouchableOpacity
                      style={styles.photoActionPrimary}
                      onPress={handleTakePhoto}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.photoActionIcon}>📸</Text>
                      <Text style={styles.photoActionTitle}>Chụp bằng Camera</Text>
                      <Text style={styles.photoActionSub}>Khuyên dùng để đủ sáng</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.photoActionSecondary}
                      onPress={handlePickImage}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.photoActionIcon}>🖼️</Text>
                      <Text style={styles.photoActionTitle}>Từ Thư Viện</Text>
                      <Text style={styles.photoActionSub}>Chọn ảnh có sẵn</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* AI Consent */}
              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => setAiConsent(!aiConsent)}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.checkboxBox, aiConsent && styles.checkboxBoxChecked]}
                >
                  {aiConsent && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.consentText}>
                  Tôi đồng ý để AI phân tích hình ảnh lòng bàn tay. Ảnh được xoá sạch EXIF bảo mật và có thể xoá bất cứ lúc nào.
                </Text>
              </TouchableOpacity>
            </TarotCard>

            {/* SUBMIT BUTTON */}
            <MysticButton
              title={
                isLogged
                  ? '🔮 KHỞI TẠO QUẺ BÓI (1 CREDIT)'
                  : '🔮 BÓI THỬ 1 LẦN (MIỄN PHÍ)'
              }
              variant="primary"
              size="lg"
              onPress={handleStartScan}
              disabled={!imageUri || !aiConsent}
              fullWidth
              style={styles.submitBtn}
            />

            <MysticButton
              title="← Quay lại sửa mục bói"
              variant="ghost"
              size="sm"
              onPress={() => setCurrentStep(2)}
              style={{ marginTop: 10 }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  // WIZARD STEP HEADER
  stepProgressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f0a1f',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  stepTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.6,
  },
  stepTabActive: {
    opacity: 1,
  },
  stepNumPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumPillActive: {
    backgroundColor: '#d4af37',
    borderColor: '#f7e7b4',
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9e8cb8',
  },
  stepNumTextActive: {
    color: '#0b0716',
  },
  stepTabTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9e8cb8',
  },
  stepTabTitleActive: {
    color: '#f7e7b4',
  },
  stepConnector: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    marginHorizontal: 8,
  },

  // GENERAL STEP CONTENT
  stepContent: {
    gap: 14,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerPreTitle: {
    fontSize: 10.5,
    color: '#d4af37',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: '#9e8cb8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },

  // SCHOOLS (STEP 1)
  schoolsList: {
    gap: 12,
  },
  schoolOptionCard: {
    padding: 16,
  },
  schoolOptionCardSelected: {
    borderColor: '#d4af37',
    backgroundColor: 'rgba(44, 29, 79, 0.4)',
  },
  schoolCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#d4af37',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d4af37',
  },
  schoolSymbolGlyph: {
    fontSize: 20,
    color: '#d4af37',
  },
  schoolTextCol: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f5e6c8',
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
  },
  schoolNameSelected: {
    color: '#f7e7b4',
  },
  schoolDesc: {
    fontSize: 13,
    color: '#9e8cb8',
    lineHeight: 19,
    paddingLeft: 30,
  },
  stepNextBtn: {
    marginTop: 10,
  },

  // TOPICS (STEP 2)
  allToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.lg,
    padding: 14,
  },
  allToggleCardActive: {
    borderColor: '#d4af37',
    backgroundColor: 'rgba(44, 29, 79, 0.4)',
  },
  allToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  allToggleTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#f7e7b4',
  },
  allToggleSubtitle: {
    fontSize: 11.5,
    color: '#9e8cb8',
    marginTop: 2,
  },
  categorySection: {
    marginTop: 6,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d4af37',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  topicChipActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderColor: '#d4af37',
  },
  topicChipIcon: {
    fontSize: 13,
  },
  topicChipText: {
    fontSize: 12.5,
    color: '#9e8cb8',
    fontWeight: '500',
  },
  topicChipTextActive: {
    color: '#f7e7b4',
    fontWeight: '700',
  },
  chipCheck: {
    fontSize: 11,
    color: '#d4af37',
    fontWeight: 'bold',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#d4af37',
    borderColor: '#f7e7b4',
  },
  checkMark: {
    color: '#0b0716',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dualNavButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },

  // HAND & CAPTURE (STEP 3)
  handCard: {
    padding: 14,
  },
  handCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#f5e6c8',
    marginBottom: 10,
  },
  handSegmented: {
    flexDirection: 'row',
    gap: 10,
  },
  handOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingVertical: 12,
    gap: 8,
  },
  handOptionActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
  },
  handEmoji: {
    fontSize: 18,
  },
  handText: {
    fontSize: 14,
    color: '#9e8cb8',
    fontWeight: '600',
  },
  handTextActive: {
    color: '#f7e7b4',
    fontWeight: '700',
  },
  handTip: {
    fontSize: 11,
    color: '#7e6d99',
    marginTop: 8,
    fontStyle: 'italic',
  },

  captureCard: {
    padding: 14,
    gap: 14,
  },
  noPhotoBox: {
    alignItems: 'center',
    gap: 14,
  },
  palmGuideFrame: {
    width: '100%',
    padding: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 175, 55, 0.45)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.lg,
    backgroundColor: 'rgba(20, 13, 38, 0.6)',
    alignItems: 'center',
  },
  guidePalmIcon: {
    fontSize: 48,
    marginBottom: 8,
    opacity: 0.85,
  },
  guideInstruction: {
    fontSize: 12.5,
    color: '#d8cbe8',
    textAlign: 'center',
    lineHeight: 18,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  photoActionPrimary: {
    flex: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: '#d4af37',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  photoActionSecondary: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  photoActionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  photoActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f5e6c8',
    textAlign: 'center',
  },
  photoActionSub: {
    fontSize: 10.5,
    color: '#9e8cb8',
    marginTop: 2,
    textAlign: 'center',
  },

  imagePreviewWrap: {
    alignItems: 'center',
    gap: 10,
  },
  imagePreview: {
    width: '100%',
    height: 260,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  imageOverlayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  retakeBtn: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  retakeText: {
    color: '#f5e6c8',
    fontSize: 12,
    fontWeight: '600',
  },

  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
  },
  consentText: {
    fontSize: 12,
    color: '#9e8cb8',
    lineHeight: 18,
    flex: 1,
  },
  submitBtn: {
    marginTop: 6,
  },

  // REJECT BANNER
  rejectNotice: {
    backgroundColor: 'rgba(251, 113, 133, 0.12)',
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.danger,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 14,
    marginBottom: 12,
  },
  rejectNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fda4af',
    marginBottom: 4,
  },
  rejectNoticeText: {
    fontSize: 12.5,
    color: '#f5e6c8',
    lineHeight: 18,
  },
  rejectNoticeSub: {
    fontSize: 11.5,
    color: '#34d399',
    marginTop: 4,
    fontWeight: '600',
  },

  // ANALYZING SCREEN
  analyzingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.canvas,
  },
  analyzingCard: {
    alignItems: 'center',
    padding: 28,
    width: '100%',
  },
  oracleHalo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1.5,
    borderColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  analyzingTitle: {
    fontSize: 18,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f7e7b4',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1.5,
  },
  analyzingDesc: {
    fontSize: 14,
    color: '#d8cbe8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  analyzingTip: {
    fontSize: 11.5,
    color: '#7e6d99',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ScanScreen;
