import React, { useState, useEffect } from 'react';
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
import {
  ReadingSchool,
  HandOrientation,
  READING_SCHOOLS,
  LIFE_ASPECTS,
} from '@palmsight/shared';
import { TarotCard } from '../components/TarotCard';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import {
  submitReadingApi,
  submitGuestReadingApi,
  describeApiError,
} from '../services/api';

interface ScanScreenProps {
  token: string | null;
  onRefreshProfile: () => void;
  onGoHistory: () => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  token,
  onRefreshProfile,
  onGoHistory,
}) => {
  // Reading configs
  const [school, setSchool] = useState<ReadingSchool>(ReadingSchool.EASTERN);
  const [isAllTopics, setIsAllTopics] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [hand, setHand] = useState<HandOrientation>(HandOrientation.LEFT);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [aiConsent, setAiConsent] = useState(true);

  // Flow & outcome
  const [loading, setLoading] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [readingResult, setReadingResult] = useState<any | null>(null);

  const schoolConfig = READING_SCHOOLS[school];
  const schoolSections = schoolConfig.sections;

  // Initialize selected topics
  useEffect(() => {
    if (isAllTopics) {
      const all = [
        ...schoolSections.map((s) => s.key),
        ...LIFE_ASPECTS.map((a) => a.key),
      ];
      setSelectedTopics(all);
    }
  }, [school, isAllTopics]);

  // Analyzing status messages cycle
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setAnalyzingStep((prev) => (prev + 1) % 3);
    }, 2800);
    return () => clearInterval(interval);
  }, [loading]);

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
    }
  };

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
    }
  };

  const toggleTopic = (key: string) => {
    if (isAllTopics) {
      setIsAllTopics(false);
      setSelectedTopics([key]);
      return;
    }
    if (selectedTopics.includes(key)) {
      if (selectedTopics.length === 1) {
        Alert.alert('Thông báo', 'Cần chọn ít nhất một mục để xem bói.');
        return;
      }
      setSelectedTopics(selectedTopics.filter((t) => t !== key));
    } else {
      setSelectedTopics([...selectedTopics, key]);
    }
  };

  const handleToggleAll = () => {
    if (isAllTopics) {
      setIsAllTopics(false);
      setSelectedTopics([schoolSections[0]?.key || 'personality']);
    } else {
      setIsAllTopics(true);
      const all = [
        ...schoolSections.map((s) => s.key),
        ...LIFE_ASPECTS.map((a) => a.key),
      ];
      setSelectedTopics(all);
    }
  };

  const handleStartScan = async () => {
    if (!imageUri) {
      Alert.alert('Thiếu ảnh', 'Vui lòng chụp hoặc tải ảnh lòng bàn tay.');
      return;
    }
    if (!aiConsent) {
      Alert.alert('Đồng ý điều khoản', 'Vui lòng đồng ý để AI phân tích ảnh.');
      return;
    }

    setLoading(true);
    setReadingResult(null);

    try {
      const topicsToSend = isAllTopics
        ? [
            ...schoolSections.map((s) => s.key),
            ...LIFE_ASPECTS.map((a) => a.key),
          ]
        : selectedTopics;

      let resData: any;
      if (token) {
        resData = await submitReadingApi({
          imageUri,
          school,
          topics: topicsToSend,
          hand,
          token,
        });
      } else {
        resData = await submitGuestReadingApi({
          imageUri,
          school,
          topics: topicsToSend,
          hand,
        });
      }

      const reading = resData.reading || resData;
      setReadingResult(reading);
      onRefreshProfile();
    } catch (err: any) {
      const msg = describeApiError(err, 'Lỗi khi gửi yêu cầu bói chỉ tay.');
      Alert.alert('Thông báo bói chỉ tay', msg);
    } finally {
      setLoading(false);
    }
  };

  const analyzingMessages = [
    '🔮 Định vị & chuẩn hóa giải phẫu lòng bàn tay...',
    '✨ Trích xuất đặc trưng các đường chỉ chính & gò hành tinh...',
    '📜 Trí tuệ nhân tạo đang luận giải bài bói theo trường phái...',
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
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
              Quá trình phân tích chuyên sâu mất khoảng 10–25 giây. Vui lòng giữ
              màn hình bật.
            </Text>
          </TarotCard>
        </View>
      ) : readingResult ? (
        /* Result Detail View */
        <View style={styles.resultBox}>
          <TarotCard style={styles.resultCard}>
            <Text style={styles.resultHeaderBadge}>✦ BÀI LUẬN GIẢI CHỈ TAY</Text>
            <Text style={styles.resultSchoolTitle}>
              {schoolConfig.name} • {readingResult.hand === 'RIGHT' ? 'Tay Phải' : 'Tay Trái'}
            </Text>

            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.resultImage}
                resizeMode="cover"
              />
            )}

            {/* Overview */}
            {readingResult.result?.overview && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>✨ Tổng Quan Vận Mệnh</Text>
                <Text style={styles.subSectionBody}>
                  {readingResult.result.overview}
                </Text>
              </View>
            )}

            {/* Sections */}
            {readingResult.result?.sections &&
              Object.entries(readingResult.result.sections).map(
                ([key, val]: any) => (
                  <View key={key} style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>
                      🔹 {val?.title || key}
                    </Text>
                    <Text style={styles.subSectionBody}>
                      {val?.description || val?.content || String(val)}
                    </Text>
                  </View>
                )
              )}

            {/* Aspects */}
            {readingResult.result?.aspects &&
              Object.entries(readingResult.result.aspects).map(
                ([key, val]: any) => (
                  <View key={key} style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>
                      🌟 Khía Cạnh: {key.toUpperCase()}
                    </Text>
                    <Text style={styles.subSectionBody}>
                      {val?.description || val?.content || String(val)}
                    </Text>
                  </View>
                )
              )}

            {/* Advice */}
            {readingResult.result?.advice && (
              <View style={[styles.subSection, styles.adviceSection]}>
                <Text style={styles.subSectionTitle}>💡 Lời Khuyên Định Hướng</Text>
                <Text style={styles.subSectionBody}>
                  {readingResult.result.advice}
                </Text>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => {
                  setReadingResult(null);
                  setImageUri(null);
                }}
              >
                <Text style={styles.btnPrimaryText}>🔄 Xem Quẻ Bói Khác</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={onGoHistory}
              >
                <Text style={styles.btnSecondaryText}>📜 Sổ Lưu Lịch Sử</Text>
              </TouchableOpacity>
            </View>
          </TarotCard>
        </View>
      ) : (
        /* Scan Flow Setup */
        <View>
          {/* Header */}
          <View style={styles.headerTitleBox}>
            <Text style={styles.badgeTop}>✦ KHAI QUẺ MỚI (−1 CREDIT)</Text>
            <Text style={styles.mainTitle}>Khám Phá Chỉ Tay</Text>
            <Text style={styles.mainDesc}>
              Chọn trường phái, khía cạnh và chụp ảnh lòng bàn tay của bạn.
            </Text>
          </View>

          {/* Step 1: Chọn trường phái */}
          <Text style={styles.stepHeader}>1. Chọn Trường Phái Bói</Text>
          {(
            [
              ReadingSchool.EASTERN,
              ReadingSchool.WESTERN,
              ReadingSchool.VEDIC,
            ] as ReadingSchool[]
          ).map((sKey) => {
            const isSelected = school === sKey;
            const cfg = READING_SCHOOLS[sKey];
            return (
              <TouchableOpacity
                key={sKey}
                style={[
                  styles.schoolOption,
                  isSelected && styles.schoolOptionSelected,
                ]}
                onPress={() => setSchool(sKey)}
                activeOpacity={0.8}
              >
                <View style={styles.schoolOptionHeader}>
                  <Text
                    style={[
                      styles.schoolOptionName,
                      isSelected && styles.schoolOptionNameSelected,
                    ]}
                  >
                    {cfg.name}
                  </Text>
                  {isSelected && <Text style={styles.checkMark}>✓ Đang chọn</Text>}
                </View>
                <Text style={styles.schoolOptionDesc}>{cfg.description}</Text>
                {cfg.handHint && (
                  <Text style={styles.schoolHint}>💡 {cfg.handHint}</Text>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Step 2: Chọn mục bói */}
          <View style={styles.rowBetween}>
            <Text style={styles.stepHeader}>2. Chọn Mục Muốn Xem</Text>
            <TouchableOpacity onPress={handleToggleAll}>
              <Text style={styles.actionToggleText}>
                {isAllTopics ? 'Tùy chọn từng mục' : '✓ Xem toàn bộ quẻ'}
              </Text>
            </TouchableOpacity>
          </View>

          {isAllTopics ? (
            <View style={styles.allTopicsBanner}>
              <Text style={styles.allTopicsText}>
                🌟 Đang chọn: <Text style={styles.highlightText}>Toàn Bộ Quẻ Bói</Text> (Bao
                gồm tất cả các đường chỉ, cung bát quái và 6 khía cạnh cuộc sống).
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.subGroupTitle}>Các phần của trường phái:</Text>
              <View style={styles.chipsWrap}>
                {schoolSections.map((sec) => {
                  const active = selectedTopics.includes(sec.key);
                  return (
                    <TouchableOpacity
                      key={sec.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleTopic(sec.key)}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {active ? '✓ ' : '+ '}
                        {sec.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.subGroupTitle}>Khía cạnh cuộc sống:</Text>
              <View style={styles.chipsWrap}>
                {LIFE_ASPECTS.map((asp) => {
                  const active = selectedTopics.includes(asp.key);
                  return (
                    <TouchableOpacity
                      key={asp.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleTopic(asp.key)}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {active ? '✓ ' : '+ '}
                        {asp.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step 3: Chọn tay */}
          <Text style={styles.stepHeader}>3. Bàn Tay Chụp</Text>
          <View style={styles.handRow}>
            <TouchableOpacity
              style={[
                styles.handCard,
                hand === HandOrientation.LEFT && styles.handCardSelected,
              ]}
              onPress={() => setHand(HandOrientation.LEFT)}
            >
              <Text style={styles.handEmoji}>✋</Text>
              <Text
                style={[
                  styles.handLabel,
                  hand === HandOrientation.LEFT && styles.handLabelSelected,
                ]}
              >
                Tay Trái
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.handCard,
                hand === HandOrientation.RIGHT && styles.handCardSelected,
              ]}
              onPress={() => setHand(HandOrientation.RIGHT)}
            >
              <Text style={styles.handEmoji}>🤚</Text>
              <Text
                style={[
                  styles.handLabel,
                  hand === HandOrientation.RIGHT && styles.handLabelSelected,
                ]}
              >
                Tay Phải
              </Text>
            </TouchableOpacity>
          </View>

          {/* Step 4: Chụp / tải ảnh */}
          <Text style={styles.stepHeader}>4. Hình Ảnh Lòng Bàn Tay</Text>
          <View style={styles.photoActionsRow}>
            <TouchableOpacity style={styles.btnAction} onPress={handleTakePhoto}>
              <Text style={styles.btnActionText}>📷 Chụp Ảnh Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAction} onPress={handlePickImage}>
              <Text style={styles.btnActionText}>🖼️ Thư Viện Ảnh</Text>
            </TouchableOpacity>
          </View>

          {imageUri ? (
            <View style={styles.previewBox}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.btnRemoveImage}
                onPress={() => setImageUri(null)}
              >
                <Text style={styles.btnRemoveImageText}>✕ Đổi ảnh khác</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyPhotoBox}>
              <Text style={styles.emptyPhotoText}>
                Chưa có ảnh bàn tay.{'\n'}Mở phẳng bàn tay, chụp trong điều kiện ánh
                sáng tốt, rõ nét các đường chỉ.
              </Text>
            </View>
          )}

          {/* Consent Checkbox */}
          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setAiConsent(!aiConsent)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, aiConsent && styles.checkboxChecked]}>
              {aiConsent && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              Tôi đồng ý gửi ảnh lòng bàn tay (đã xoá EXIF) cho AI phân tích theo
              chính sách bảo mật.
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.btnSubmit,
              (!imageUri || !aiConsent || loading) && styles.btnSubmitDisabled,
            ]}
            onPress={handleStartScan}
            disabled={!imageUri || !aiConsent || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSubmitText}>
              ✨ BẮT ĐẦU LUẬN GIẢI (−1 CREDIT)
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
    paddingBottom: 40,
  },
  headerTitleBox: {
    marginBottom: 16,
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
  stepHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    marginTop: 18,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  actionToggleText: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  schoolOption: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 14,
    marginBottom: 10,
  },
  schoolOptionSelected: {
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
  },
  schoolOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  schoolOptionName: {
    fontSize: 16,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
  },
  schoolOptionNameSelected: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  checkMark: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  schoolOptionDesc: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    lineHeight: 18,
  },
  schoolHint: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    marginTop: 6,
  },
  allTopicsBanner: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
    marginBottom: 8,
  },
  allTopicsText: {
    fontSize: 12,
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    lineHeight: 18,
  },
  highlightText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '800',
  },
  subGroupTitle: {
    fontSize: 11,
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipActive: {
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  chipText: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 12,
  },
  chipTextActive: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '700',
  },
  handRow: {
    flexDirection: 'row',
    gap: 12,
  },
  handCard: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  handCardSelected: {
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
  },
  handEmoji: {
    fontSize: 26,
  },
  handLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
  },
  handLabelSelected: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  btnAction: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
    paddingVertical: 12,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
  },
  btnActionText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '700',
    fontSize: 13,
  },
  previewBox: {
    alignItems: 'center',
    marginBottom: 14,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
  },
  btnRemoveImage: {
    marginTop: 8,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  btnRemoveImageText: {
    color: PALMSIGHT_MOBILE_THEME.colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyPhotoBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyPhotoText: {
    color: PALMSIGHT_MOBILE_THEME.colors.ash,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
  },
  checkboxCheck: {
    color: PALMSIGHT_MOBILE_THEME.colors.canvas,
    fontSize: 12,
    fontWeight: '900',
  },
  consentText: {
    flex: 1,
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 12,
    lineHeight: 18,
  },
  btnSubmit: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    paddingVertical: 15,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  btnSubmitDisabled: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.ash,
    shadowOpacity: 0,
  },
  btnSubmitText: {
    color: PALMSIGHT_MOBILE_THEME.colors.canvas,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  analyzingBox: {
    paddingVertical: 40,
  },
  analyzingCard: {
    padding: 28,
    alignItems: 'center',
  },
  pulseContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    marginBottom: 20,
  },
  analyzingTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  analyzingDesc: {
    color: PALMSIGHT_MOBILE_THEME.colors.ink,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  analyzingTip: {
    color: PALMSIGHT_MOBILE_THEME.colors.mute,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  resultBox: {
    paddingVertical: 10,
  },
  resultCard: {
    padding: 18,
  },
  resultHeaderBadge: {
    color: PALMSIGHT_MOBILE_THEME.colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  resultSchoolTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    textAlign: 'center',
    marginBottom: 14,
  },
  resultImage: {
    width: '100%',
    height: 220,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairlineStrong,
  },
  subSection: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceSoft,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: PALMSIGHT_MOBILE_THEME.colors.hairline,
    marginBottom: 12,
  },
  adviceSection: {
    borderColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  subSectionTitle: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  subSectionBody: {
    color: PALMSIGHT_MOBILE_THEME.colors.body,
    fontSize: 13,
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.gold,
    paddingVertical: 13,
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
    paddingVertical: 13,
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: PALMSIGHT_MOBILE_THEME.colors.goldLight,
    fontWeight: '700',
    fontSize: 13,
  },
});
