import {
  PalmLineDto,
  PalmLineName,
  ReadingSchool,
  HandOrientation,
} from '@palmsight/shared';

export type MajorPalmLineKey = 'heart' | 'head' | 'life';

export interface MajorPalmLineConfig {
  key: MajorPalmLineKey;
  title: string;
  subTitle: string;
  icon: string;
  color: string;
  activeBg: string;
  activeBorder: string;
}

export const THREE_MAJOR_LINES: MajorPalmLineConfig[] = [
  {
    key: 'heart',
    title: 'Đường Tình Cảm',
    subTitle: 'Tâm đạo',
    icon: '❤️',
    color: '#ff2d55',
    activeBg: 'rgba(255, 45, 85, 0.22)',
    activeBorder: '#ff2d55',
  },
  {
    key: 'head',
    title: 'Đường Trí Đạo',
    subTitle: 'Trí tuệ',
    icon: '💡',
    color: '#ff9500',
    activeBg: 'rgba(255, 149, 0, 0.22)',
    activeBorder: '#ff9500',
  },
  {
    key: 'life',
    title: 'Đường Sinh Mệnh',
    subTitle: 'Sinh đạo',
    icon: '🌿',
    color: '#34c759',
    activeBg: 'rgba(52, 199, 89, 0.22)',
    activeBorder: '#34c759',
  },
];

export const PALM_LINE_COLORS: Record<MajorPalmLineKey, string> = {
  heart: '#ff2d55',
  head: '#ff9500',
  life: '#34c759',
};

export interface PalmLineDisplayInfo {
  name: MajorPalmLineKey;
  nameLabel: string;
  subLabel: string;
  color: string;
}

export function getPalmLineDisplayInfo(
  lineName: MajorPalmLineKey,
  school: ReadingSchool = ReadingSchool.WESTERN
): PalmLineDisplayInfo {
  if (lineName === 'heart') {
    return {
      name: 'heart',
      nameLabel: 'Đường Tình Cảm',
      subLabel: school === ReadingSchool.EASTERN ? 'Tâm đạo (Thiên văn)' : 'Tình duyên & Trái tim',
      color: '#ff2d55',
    };
  }
  if (lineName === 'head') {
    return {
      name: 'head',
      nameLabel: 'Đường Trí Đạo',
      subLabel: school === ReadingSchool.EASTERN ? 'Trí đạo (Nhân văn)' : 'Trí tuệ & Tư duy',
      color: '#ff9500',
    };
  }
  return {
    name: 'life',
    nameLabel: 'Đường Sinh Mệnh',
    subLabel: school === ReadingSchool.EASTERN ? 'Sinh đạo (Địa văn)' : 'Sinh mệnh & Sức sống',
    color: '#34c759',
  };
}

export function resolveEffectivePalmLines(
  palmLines?: PalmLineDto[] | null,
  _hand: HandOrientation = HandOrientation.RIGHT
): PalmLineDto[] {
  if (!Array.isArray(palmLines) || palmLines.length === 0) {
    return [];
  }

  // CHỈ lấy đúng 3 đường chính: heart, head, life! Tuyệt đối không lấy đường khác
  const valid = palmLines.filter(
    (line) =>
      (line.name === 'heart' || line.name === 'head' || line.name === 'life') &&
      Array.isArray(line.points) &&
      line.points.length >= 2
  );

  const priority: Record<string, number> = {
    heart: 0,
    head: 1,
    life: 2,
  };

  return [...valid].sort(
    (a, b) => (priority[a.name] ?? 99) - (priority[b.name] ?? 99)
  );
}
