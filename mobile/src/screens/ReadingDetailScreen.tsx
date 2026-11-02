import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { PALMSIGHT_MOBILE_THEME } from '../theme/tokens';
import { TarotCard } from '../components/TarotCard';
import readingsService from '../services/readingsService';
import { formatDate } from '../helpers/common';
import { showError, showSuccess } from '../helpers/toast';
import {
  ReadingDto,
  READING_SCHOOLS,
  ReadingSchool,
  HandOrientation,
  ReadingStatus,
  LIFE_ASPECTS,
  ImageQuality,
  getTopicLabel,
  PalmLineName,
} from '@palmsight/shared';
import { MysticButton } from '../components/MysticButton';
import { MysticBadge } from '../components/MysticBadge';
import {
  PALM_LINE_COLORS,
  resolveEffectivePalmLines,
  getPalmLineDisplayInfo,
  THREE_MAJOR_LINES,
  MajorPalmLineKey,
} from '../helpers/palmLineOverlay';

export function findMatchingSection(
  lineName: MajorPalmLineKey,
  _school: ReadingSchool,
  sections?: Array<{ key?: string; title?: string }> | null
): { key: string; index: number } | null {
  if (!sections || sections.length === 0) return null;

  const keyCandidates: Record<MajorPalmLineKey, string[]> = {
    heart: ['heartLine', 'thienVan', 'tamDao', 'tinhCam'],
    head: ['headLine', 'nhanVan', 'triDao', 'triTue'],
    life: ['lifeLine', 'diaVan', 'sinhDao', 'sinhMenh'],
  };

  const titleKeywords: Record<MajorPalmLineKey, string[]> = {
    heart: ['tình cảm', 'tâm đạo', 'thiên văn', 'heart', 'tâm'],
    head: ['trí đạo', 'trí tuệ', 'nhân văn', 'head', 'trí'],
    life: ['sinh mệnh', 'sinh đạo', 'địa văn', 'life', 'sinh'],
  };

  // 1. So khớp chính xác theo key (không phân biệt hoa thường)
  const cands = keyCandidates[lineName] || [];
  for (const c of cands) {
    const idx = sections.findIndex(
      (s) => s.key && s.key.toLowerCase() === c.toLowerCase()
    );
    if (idx !== -1) {
      return { key: sections[idx].key || String(idx), index: idx };
    }
  }

  // 2. So khớp theo từ khóa trong tiêu đề
  const kws = titleKeywords[lineName] || [];
  for (const kw of kws) {
    const idx = sections.findIndex(
      (s) => s.title && s.title.toLowerCase().includes(kw)
    );
    if (idx !== -1) {
      return { key: sections[idx].key || String(idx), index: idx };
    }
  }

  // 3. Fallback cho trường phái Vệ Đà
  const majorIdx = sections.findIndex((s) => s.key === 'majorLines');
  if (majorIdx !== -1) {
    return { key: sections[majorIdx].key || String(majorIdx), index: majorIdx };
  }

  return null;
}

interface ReadingDetailScreenProps {
  readingId?: string | null;
  initialReading?: ReadingDto | null;
  onBack: () => void;
  onDeleted?: () => void;
}

export const ReadingDetailScreen: React.FC<ReadingDetailScreenProps> = ({
  readingId,
  initialReading,
  onBack,
  onDeleted,
}) => {
  const [reading, setReading] = useState<ReadingDto | null>(initialReading || null);
  const [loading, setLoading] = useState<boolean>(!initialReading && !!readingId);
  const [deleting, setDeleting] = useState(false);
  const [showAnnotated, setShowAnnotated] = useState(true);
  const [activeLine, setActiveLine] = useState<MajorPalmLineKey | null>(null);
  const [highlightedSectionKey, setHighlightedSectionKey] = useState<string | null>(null);
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  const handleImageTouch = (evt: any) => {
    if (!imageLayout.width || !imageLayout.height) return;
    const { locationX, locationY } = evt.nativeEvent;
    const normX = locationX / imageLayout.width;
    const normY = locationY / imageLayout.height;

    // CHỈ so khớp với 3 đường chính: heart, head, life!
    const validLines = effectiveLines.filter(
      (l) => l.name === 'heart' || l.name === 'head' || l.name === 'life'
    );

    let closestLine: MajorPalmLineKey | null = null;
    let minDistance = 0.22;

    for (const line of validLines) {
      if (!Array.isArray(line.points)) continue;
      for (const [px, py] of line.points) {
        const nx = px > 1 ? px / 512 : px;
        const ny = py > 1 ? py / 512 : py;
        const dist = Math.hypot(nx - normX, ny - normY);
        if (dist < minDistance) {
          minDistance = dist;
          closestLine = line.name as MajorPalmLineKey;
        }
      }
    }

    if (closestLine) {
      handleSelectLine(closestLine);
    }
  };

  const scrollViewRef = useRef<any>(null);
  const detailCardOffsetRef = useRef<number>(0);
  const blockGroupOffsetRef = useRef<number>(0);
  const cardLocalOffsetsRef = useRef<Record<string, number>>({});
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (readingId && !initialReading) {
      let active = true;
      setLoading(true);
      readingsService
        .getReadingById(readingId)
        .then((data) => {
          if (active) setReading(data);
        })
        .catch(() => {
          showError('Không thể tải bài luận giải chi tiết.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }
  }, [readingId, initialReading]);

  const effectiveLines = useMemo(() => {
    if (!reading) return [];
    return resolveEffectivePalmLines(reading.palmLines, reading.hand);
  }, [reading?.palmLines, reading?.hand]);

  const selectedLineData = useMemo(() => {
    if (!activeLine || effectiveLines.length === 0) return null;
    return effectiveLines.find((l) => l.name === activeLine);
  }, [activeLine, effectiveLines]);

  const selectedPointsStr = useMemo(() => {
    if (
      !selectedLineData ||
      !Array.isArray(selectedLineData.points) ||
      selectedLineData.points.length < 2
    ) {
      return '';
    }
    return selectedLineData.points
      .map(([x, y]) => {
        const px = x > 1 ? (x / 512) * 100 : x * 100;
        const py = y > 1 ? (y / 512) * 100 : y * 100;
        return `${px.toFixed(2)},${py.toFixed(2)}`;
      })
      .join(' ');
  }, [selectedLineData]);

  const handleDelete = () => {
    if (!reading) return;
    Alert.alert(
      'Xóa bài luận giải',
      'Bạn có chắc chắn muốn xóa bài bói này khỏi sổ thiên mệnh? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await readingsService.deleteReading(reading.id);
              showSuccess('Đã xóa bài bói.');
              onDeleted?.();
              onBack();
            } catch {
              showError('Không thể xóa bài bói lúc này.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSelectLine = (lineName: MajorPalmLineKey) => {
    if (!reading) return;
    setActiveLine(lineName);

    const match = findMatchingSection(
      lineName,
      reading.school,
      reading.result?.sections
    );

    if (match) {
      const cardY = cardLocalOffsetsRef.current[match.key];
      if (typeof cardY === 'number') {
        const absoluteTargetY = Math.max(
          0,
          (detailCardOffsetRef.current || 0) +
            (blockGroupOffsetRef.current || 0) +
            cardY -
            10
        );
        scrollViewRef.current?.scrollTo({
          y: absoluteTargetY,
          animated: true,
        });

        setHighlightedSectionKey(match.key);
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => {
          setHighlightedSectionKey(null);
        }, 3200);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.loadingText}>Đang khai mở cuộn văn thư bí truyền...</Text>
      </View>
    );
  }

  if (!reading) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>Không tìm thấy bài luận giải này.</Text>
        <MysticButton title="← Quay lại Lịch sử" variant="secondary" size="md" onPress={onBack} />
      </View>
    );
  }

  const result = reading.result;
  const schoolConfig = READING_SCHOOLS[reading.school];
  const schoolName = schoolConfig?.name || reading.school;
  const handName = reading.hand === HandOrientation.RIGHT ? 'Tay Phải' : 'Tay Trái';
  const isPoorQuality = result?.imageQuality === ImageQuality.POOR;
  const totalSections = schoolConfig?.sections?.length ?? 0;
  const isAll =
    !reading.topics ||
    reading.topics.length === 0 ||
    reading.topics.length >= totalSections + 6;

  const getAspectLabel = (key: string) => {
    const found = LIFE_ASPECTS.find((a) => a.key === key);
    return found ? found.label : key;
  };

  const currentDisplayImage =
    showAnnotated && reading.annotatedImageUrl
      ? reading.annotatedImageUrl
      : reading.imageUrl || reading.annotatedImageUrl;

  useEffect(() => {
    if (currentDisplayImage) {
      Image.getSize(
        currentDisplayImage,
        (w, h) => {
          if (w > 0 && h > 0) {
            setImageAspectRatio(w / h);
          }
        },
        () => {}
      );
    }
  }, [currentDisplayImage]);

  const activeLineInfo = activeLine
    ? getPalmLineDisplayInfo(activeLine, reading.school)
    : null;

  return (
    <View style={styles.rootContainer}>
      {/* ============================================================ */}
      {/* 1. FIXED TOP REGION: CỐ ĐỊNH HOÀN TOÀN TRÊN MÀN HÌNH         */}
      {/* ============================================================ */}
      <View style={styles.fixedHeaderRegion}>
        {/* Top Nav Bar */}
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>← Sổ Thiên Mệnh</Text>
          </TouchableOpacity>

          <View style={styles.headerBadges}>
            <MysticBadge label={`✦ ${schoolName}`} variant="gold" size="sm" />
            <MysticBadge label={handName} variant="mute" size="sm" />
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteBtnText}>🗑 Xóa</Text>
          </TouchableOpacity>
        </View>

        {/* Pinned Palm Card: Ảnh bàn tay + SVG vẽ trực tiếp chỉ tay để bấm */}
        <TarotCard style={styles.pinnedPalmCard}>
          {currentDisplayImage ? (
            <View style={styles.palmViewerSection}>
              {/* Khung ảnh lòng bàn tay kèm lớp vẽ SVG đè lên trên */}
              <View
                style={[
                  styles.palmImageWrapper,
                  imageAspectRatio ? { aspectRatio: imageAspectRatio } : null,
                ]}
                onLayout={(e) => {
                  const { width, height } = e.nativeEvent.layout;
                  setImageLayout({ width, height });
                }}
                onStartShouldSetResponder={() => true}
                onResponderRelease={handleImageTouch}
              >
                <Image
                  source={{ uri: currentDisplayImage }}
                  style={styles.palmImage}
                  resizeMode="cover"
                />

                {/* 1. LỚP VẼ 3 ĐƯỜNG CHỈ TAY CHÍNH: TÂM ĐẠO, TRÍ ĐẠO, SINH ĐẠO */}
                {showAnnotated && effectiveLines.length > 0 && (
                  <Svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  >
                    {effectiveLines.map((line) => {
                      const key = line.name as MajorPalmLineKey;
                      if (key !== 'heart' && key !== 'head' && key !== 'life') return null;
                      if (!Array.isArray(line.points) || line.points.length < 2) return null;
                      const pts = line.points
                        .map(([x, y]) => {
                          const px = x > 1 ? (x / 512) * 100 : x * 100;
                          const py = y > 1 ? (y / 512) * 100 : y * 100;
                          return `${px.toFixed(2)},${py.toFixed(2)}`;
                        })
                        .join(' ');
                      const strokeColor = PALM_LINE_COLORS[key] || '#ff2d55';
                      const isSelected = activeLine === key;
                      return (
                        <Polyline
                          key={key}
                          points={pts}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isSelected ? '4.5' : '3.5'}
                          strokeOpacity={isSelected ? 1 : 0.75}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      );
                    })}
                  </Svg>
                )}

                {/* 2. HIỆU ỨNG PHÁT SÁNG NỔI BẬT KHI ĐƯỜNG CHỈ TAY ĐƯỢC CHỌN (VẼ ĐÈ LÊN TRÊN) */}
                {showAnnotated && selectedLineData && selectedPointsStr ? (
                  <Svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  >
                    {/* Vầng hào quang sáng rộng bên ngoài */}
                    <Polyline
                      points={selectedPointsStr}
                      fill="none"
                      stroke={
                        PALM_LINE_COLORS[selectedLineData.name as MajorPalmLineKey] ||
                        '#ff2d55'
                      }
                      strokeWidth="15"
                      strokeOpacity="0.45"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Vầng sáng trung gian sắc nét */}
                    <Polyline
                      points={selectedPointsStr}
                      fill="none"
                      stroke={
                        PALM_LINE_COLORS[selectedLineData.name as MajorPalmLineKey] ||
                        '#ff2d55'
                      }
                      strokeWidth="8"
                      strokeOpacity="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Lõi sáng trắng rực rỡ */}
                    <Polyline
                      points={selectedPointsStr}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="3.5"
                      strokeOpacity="0.95"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                ) : null}

                {/* Huy hiệu hướng dẫn chạm trên ảnh */}
                <View style={styles.imageOverlayHint}>
                  <Text style={styles.imageOverlayHintText}>
                    👆 Bấm vào đường chỉ tay trong ảnh AI
                  </Text>
                </View>

                {/* Toggle AI Vẽ vs Ảnh gốc */}
                {(reading.annotatedImageUrl || effectiveLines.length > 0) && reading.imageUrl && (
                  <View style={styles.imageCornerToggle}>
                    <TouchableOpacity
                      style={[styles.cornerToggleBtn, showAnnotated && styles.cornerToggleBtnActive]}
                      onPress={() => setShowAnnotated(true)}
                    >
                      <Text style={[styles.cornerToggleText, showAnnotated && styles.cornerToggleTextActive]}>
                        AI Vẽ
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cornerToggleBtn, !showAnnotated && styles.cornerToggleBtnActive]}
                      onPress={() => setShowAnnotated(false)}
                    >
                      <Text style={[styles.cornerToggleText, !showAnnotated && styles.cornerToggleTextActive]}>
                        Gốc
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* 3 Ô ĐƯỜNG CHỈ TAY CHÍNH: TÌNH CẢM, TRÍ ĐẠO, SINH MỆNH */}
              <View style={styles.majorLinesContainer}>
                <View style={styles.majorLinesRow}>
                  {THREE_MAJOR_LINES.map((item) => {
                    const isSelected = activeLine === item.key;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.majorLineBtn,
                          isSelected && {
                            borderColor: item.activeBorder,
                            backgroundColor: item.activeBg,
                            elevation: 4,
                          },
                        ]}
                        onPress={() => handleSelectLine(item.key)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.majorLineHeader}>
                          <Text style={styles.majorLineIcon}>{item.icon}</Text>
                          <View
                            style={[
                              styles.majorLineDot,
                              { backgroundColor: item.color },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.majorLineTitle,
                            isSelected && { color: '#ffffff', fontWeight: '800' },
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.majorLineAlias}>({item.subTitle})</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Banner trạng thái đường đang chọn */}
                {activeLineInfo ? (
                  <View style={styles.activeLineBanner}>
                    <Text style={styles.activeLineBannerText}>
                      ✦ Đang xem:{' '}
                      <Text
                        style={{
                          color: activeLineInfo.color,
                          fontWeight: '700',
                        }}
                      >
                        {activeLineInfo.nameLabel}
                      </Text>{' '}
                      — {activeLineInfo.subLabel}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.activeLineBannerMuted}>
                    <Text style={styles.activeLineBannerMutedText}>
                      👆 Bấm 1 trong 3 đường trên hoặc chạm trên ảnh AI để xem luận giải
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : null}
        </TarotCard>

        {/* Rejected Banner */}
        {reading.status === ReadingStatus.REJECTED && (
          <View style={styles.rejectedBanner}>
            <Text style={styles.rejectedTitle}>⚠️ Không thể luận giải</Text>
            <Text style={styles.rejectedDesc}>
              {reading.rejectReason ||
                'Ảnh bàn tay không đủ độ sắc nét hoặc góc chụp chưa chuẩn xác. Credit đã được hoàn trả vào ví của bạn.'}
            </Text>
          </View>
        )}
      </View>

      {/* ============================================================ */}
      {/* 2. SCROLLABLE TEXT REGION: CHỈ CUỘN RIÊNG PHẦN CHỮ NÀY       */}
      {/* ============================================================ */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <TarotCard
          style={styles.detailCard}
          onLayout={(e: LayoutChangeEvent) => {
            detailCardOffsetRef.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.detailCardHeader}>
            <Text style={styles.scrollIcon}>📜</Text>
            <Text style={styles.detailCardTitle}>Bản Luận Giải Chỉ Tay</Text>
          </View>

          {isPoorQuality && (
            <View style={styles.poorQualityBox}>
              <Text style={styles.poorQualityText}>
                ⚠️ Ảnh chụp hơi mờ, kết quả có thể chưa đạt độ sắc nét tuyệt đối.
              </Text>
            </View>
          )}

          {/* Selected Topics Info */}
          {!isAll && reading.topics && reading.topics.length > 0 && (
            <View style={styles.selectedTopicsBanner}>
              <Text style={styles.selectedTopicsLabel}>Mục đã xem:</Text>
              <View style={styles.selectedTopicsList}>
                {reading.topics.map((key) => (
                  <MysticBadge
                    key={key}
                    label={getTopicLabel(key, reading.school)}
                    variant="mute"
                    size="sm"
                  />
                ))}
              </View>
            </View>
          )}

          {/* SUMMARY */}
          {result?.summary && (
            <View style={styles.summaryBox}>
              <View style={styles.summaryTitleRow}>
                <Text style={styles.summaryIcon}>✨</Text>
                <Text style={styles.summaryTitle}>Tổng quan thiên mệnh</Text>
              </View>
              <Text style={styles.summaryText}>{result.summary}</Text>
            </View>
          )}

          {/* SECTIONS: ĐƯỜNG CHỈ CHÍNH */}
          {Array.isArray(result?.sections) && result.sections.length > 0 && (
            <View
              style={styles.blockGroup}
              onLayout={(e: LayoutChangeEvent) => {
                blockGroupOffsetRef.current = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.blockHeading}>
                ✦ Đường Chỉ & Dấu Hiệu Chiêm Đoán
              </Text>
              {result.sections.map((sec, idx) => {
                const secId = sec.key || String(idx);
                const isHighlighted = highlightedSectionKey === secId;

                return (
                  <View
                    key={secId}
                    onLayout={(e: LayoutChangeEvent) => {
                      cardLocalOffsetsRef.current[secId] = e.nativeEvent.layout.y;
                    }}
                    style={[
                      styles.sectionItemCard,
                      isHighlighted && styles.sectionItemCardHighlighted,
                    ]}
                  >
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionItemTitle}>
                        {sec.title || sec.key}
                      </Text>
                      {isHighlighted && (
                        <MysticBadge label="✦ Đang xem" variant="gold" size="sm" />
                      )}
                    </View>

                    {sec.observation && (
                      <View style={styles.subBoxObservation}>
                        <Text style={styles.subBoxLabel}>👁️ Nhận diện thực tế:</Text>
                        <Text style={styles.subBoxContent}>{sec.observation}</Text>
                      </View>
                    )}

                    {sec.meaning && (
                      <View style={styles.subBoxMeaning}>
                        <Text style={styles.subBoxLabelGold}>✨ Luận giải ý nghĩa:</Text>
                        <Text style={styles.subBoxContentHighlight}>
                          {sec.meaning}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ASPECTS: KHÍA CẠNH CUỘC SỐNG */}
          {result?.aspects && Object.keys(result.aspects).length > 0 && (
            <View style={styles.blockGroup}>
              <Text style={styles.blockHeading}>✦ Khía Cạnh Cuộc Sống</Text>
              <View style={styles.aspectsStack}>
                {Object.entries(result.aspects).map(([key, val]: any) => (
                  <View key={key} style={styles.aspectCard}>
                    <Text style={styles.aspectHeading}>◆ {getAspectLabel(key)}</Text>
                    <Text style={styles.aspectBody}>
                      {typeof val === 'string'
                        ? val
                        : val?.description || val?.content}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ADVICE */}
          {result?.advice && (
            <View style={styles.adviceBox}>
              <View style={styles.adviceHeaderRow}>
                <Text style={styles.adviceIcon}>🧭</Text>
                <Text style={styles.adviceTitle}>Lời Khuyên Chỉ Dẫn</Text>
              </View>
              <Text style={styles.adviceText}>{result.advice}</Text>
            </View>
          )}

          {/* DISCLAIMER */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              {result?.disclaimer ||
                '✧ Thông tin chiêm đoán mang tính chất giải trí & văn hoá cổ truyền. Hành động và ý chí của bạn quyết định tương lai thực sự.'}
            </Text>
          </View>
        </TarotCard>

        {/* Space padding at the bottom of text content */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0b0716',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0b0716',
    gap: 12,
  },
  loadingText: {
    marginTop: 14,
    color: '#d8cbe8',
    fontSize: 14,
  },
  errorText: {
    color: '#fb7185',
    fontSize: 15,
    textAlign: 'center',
  },

  // 1. FIXED TOP REGION
  fixedHeaderRegion: {
    backgroundColor: '#0b0716',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
    zIndex: 10,
    elevation: 5,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 6,
  },
  backBtn: {
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 13,
    color: '#d4af37',
    fontWeight: '600',
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteBtn: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.3)',
  },
  deleteBtnText: {
    fontSize: 11.5,
    color: '#fb7185',
    fontWeight: '600',
  },

  // PINNED PALM CARD
  pinnedPalmCard: {
    padding: 8,
    gap: 6,
    backgroundColor: 'rgba(20, 13, 38, 0.95)',
  },
  palmViewerSection: {
    gap: 6,
  },
  palmImageWrapper: {
    width: '100%',
    aspectRatio: 0.75,
    maxHeight: 220,
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#07040f',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
  },
  palmImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayHint: {
    position: 'absolute',
    top: 6,
    left: 8,
    backgroundColor: 'rgba(11, 7, 22, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  imageOverlayHintText: {
    fontSize: 10,
    color: '#f5e6c8',
    fontWeight: '600',
  },
  imageCornerToggle: {
    position: 'absolute',
    top: 6,
    right: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(11, 7, 22, 0.85)',
    borderRadius: 4,
    padding: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  cornerToggleBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  cornerToggleBtnActive: {
    backgroundColor: '#d4af37',
  },
  cornerToggleText: {
    fontSize: 9.5,
    color: '#d8cbe8',
    fontWeight: '600',
  },
  cornerToggleTextActive: {
    color: '#0b0716',
    fontWeight: '700',
  },

  majorLinesContainer: {
    gap: 5,
    marginTop: 4,
  },
  majorLinesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  majorLineBtn: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  majorLineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  majorLineIcon: {
    fontSize: 12,
  },
  majorLineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  majorLineTitle: {
    fontSize: 11,
    color: '#f5e6c8',
    fontWeight: '700',
    textAlign: 'center',
  },
  majorLineAlias: {
    fontSize: 9.5,
    color: '#9e8cb8',
    textAlign: 'center',
  },
  activeLineBanner: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.8,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  activeLineBannerText: {
    fontSize: 11,
    color: '#f5e6c8',
    textAlign: 'center',
  },
  activeLineBannerMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeLineBannerMutedText: {
    fontSize: 10,
    color: '#9e8cb8',
    textAlign: 'center',
  },

  rejectedBanner: {
    marginTop: 6,
    backgroundColor: 'rgba(251, 113, 133, 0.12)',
    borderWidth: 1,
    borderColor: '#fb7185',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 10,
  },
  rejectedTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#fda4af',
    marginBottom: 2,
  },
  rejectedDesc: {
    fontSize: 11.5,
    color: '#f5e6c8',
    lineHeight: 16,
  },

  // 2. SCROLLABLE TEXT REGION
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  detailCard: {
    padding: 16,
    gap: 16,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    paddingBottom: 10,
  },
  scrollIcon: {
    fontSize: 18,
  },
  detailCardTitle: {
    fontSize: 17,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#f5e6c8',
  },

  poorQualityBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.sm,
    padding: 10,
  },
  poorQualityText: {
    fontSize: 12,
    color: '#fbbf24',
    lineHeight: 16,
  },

  selectedTopicsBanner: {
    gap: 6,
  },
  selectedTopicsLabel: {
    fontSize: 11.5,
    color: '#9e8cb8',
    fontWeight: '600',
  },
  selectedTopicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  summaryBox: {
    backgroundColor: 'rgba(20, 13, 38, 0.85)',
    borderLeftWidth: 3,
    borderLeftColor: '#d4af37',
    borderRadius: 6,
    padding: 14,
    gap: 6,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryIcon: {
    fontSize: 14,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d4af37',
  },
  summaryText: {
    fontSize: 13.5,
    color: '#f5e6c8',
    lineHeight: 21,
    fontStyle: 'italic',
  },

  blockGroup: {
    gap: 12,
  },
  blockHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f7e7b4',
    letterSpacing: 0.5,
  },

  sectionItemCard: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 14,
    gap: 10,
  },
  sectionItemCardHighlighted: {
    borderColor: '#d4af37',
    borderWidth: 1.5,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionItemTitle: {
    fontSize: 15,
    fontFamily: PALMSIGHT_MOBILE_THEME.typography.fontDisplay,
    fontWeight: '700',
    color: '#fff3d1',
    flex: 1,
  },
  subBoxObservation: {
    gap: 4,
  },
  subBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9e8cb8',
    letterSpacing: 0.5,
  },
  subBoxContent: {
    fontSize: 13,
    color: '#d8cbe8',
    lineHeight: 19,
  },
  subBoxMeaning: {
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 6,
    padding: 10,
  },
  subBoxLabelGold: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: 0.5,
  },
  subBoxContentHighlight: {
    fontSize: 13,
    color: '#f5e6c8',
    lineHeight: 19,
  },

  aspectsStack: {
    gap: 8,
  },
  aspectCard: {
    backgroundColor: PALMSIGHT_MOBILE_THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 12,
    gap: 4,
  },
  aspectHeading: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#d4af37',
  },
  aspectBody: {
    fontSize: 12.5,
    color: '#d8cbe8',
    lineHeight: 18,
  },

  adviceBox: {
    backgroundColor: 'rgba(44, 29, 79, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: PALMSIGHT_MOBILE_THEME.radius.md,
    padding: 14,
    gap: 6,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adviceIcon: {
    fontSize: 16,
  },
  adviceTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#f7e7b4',
  },
  adviceText: {
    fontSize: 13,
    color: '#f5e6c8',
    lineHeight: 19,
  },

  disclaimerBox: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#7e6d99',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

export default ReadingDetailScreen;
