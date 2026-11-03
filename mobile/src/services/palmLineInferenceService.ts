import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import * as jpeg from 'jpeg-js';
import type { PalmLineDto, PalmLineName } from '@palmsight/shared';
import { PALM_MODEL_REMOTE_URL } from './onnxModelService';

const OUT_SIZE = 512;
const THRESH = 0.4;
const MIN_MASK_SIZE = 150;
const MIN_LINE_LEN = 35;
const SPUR_LEN = 16;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

export interface BuiltSkeletonLine {
  points: [number, number][];
  orderedPixels: [number, number][];
  subpaths: [number, number][][];
  mainPath: [number, number][];
  lengthPx: number;
  nBranches: number;
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP = new Uint8Array(256);
for (let i = 0; i < B64_CHARS.length; i++) {
  B64_LOOKUP[B64_CHARS.charCodeAt(i)] = i;
}

/**
 * Chuyển đổi base64 thành Uint8Array tương thích mọi môi trường JS / React Native
 */
export function base64ToUint8Array(b64: string): Uint8Array {
  const clean = b64.replace(/^data:image\/[a-z]+;base64,/, '').replace(/\s+/g, '');
  const globalBuffer = (globalThis as any).Buffer;
  if (globalBuffer) {
    return new Uint8Array(globalBuffer.from(clean, 'base64'));
  }
  if (typeof atob === 'function') {
    const bin = atob(clean);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      u8[i] = bin.charCodeAt(i);
    }
    return u8;
  }
  let len = clean.length;
  if (clean.endsWith('==')) len -= 2;
  else if (clean.endsWith('=')) len -= 1;
  const byteLen = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(byteLen);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const enc1 = B64_LOOKUP[clean.charCodeAt(i)];
    const enc2 = B64_LOOKUP[clean.charCodeAt(i + 1)];
    const enc3 = B64_LOOKUP[clean.charCodeAt(i + 2)];
    const enc4 = B64_LOOKUP[clean.charCodeAt(i + 3)];
    bytes[p++] = (enc1 << 2) | (enc2 >> 4);
    if (enc3 !== 64 && p < byteLen) bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2);
    if (enc4 !== 64 && p < byteLen) bytes[p++] = ((enc3 & 3) << 6) | enc4;
  }
  return bytes;
}

/**
 * Resize và căn giữa (fit cover) mảng pixel RGBA về kích thước 512x512
 */
export function resizeRgbaTo512(
  srcData: Uint8Array,
  srcW: number,
  srcH: number,
  targetW = OUT_SIZE,
  targetH = OUT_SIZE
): Uint8Array {
  const srcAspect = srcW / srcH;
  const targetAspect = targetW / targetH;
  let cropX = 0;
  let cropY = 0;
  let cropW = srcW;
  let cropH = srcH;

  if (srcAspect > targetAspect) {
    cropW = Math.round(srcH * targetAspect);
    cropX = Math.floor((srcW - cropW) / 2);
  } else {
    cropH = Math.round(srcW / targetAspect);
    cropY = Math.floor((srcH - cropH) / 2);
  }

  const out = new Uint8Array(targetW * targetH * 4);
  const xRatio = cropW / targetW;
  const yRatio = cropH / targetH;

  for (let y = 0; y < targetH; y++) {
    const srcY = cropY + Math.min(Math.floor(y * yRatio), cropH - 1);
    const rowOffset = y * targetW * 4;
    const srcRowOffset = srcY * srcW * 4;
    for (let x = 0; x < targetW; x++) {
      const srcX = cropX + Math.min(Math.floor(x * xRatio), cropW - 1);
      const srcIdx = srcRowOffset + srcX * 4;
      const targetIdx = rowOffset + x * 4;
      out[targetIdx] = srcData[srcIdx];
      out[targetIdx + 1] = srcData[srcIdx + 1];
      out[targetIdx + 2] = srcData[srcIdx + 2];
      out[targetIdx + 3] = srcData[srcIdx + 3];
    }
  }
  return out;
}

/**
 * Chuẩn hoá ảnh RGBA 512x512 thành tensor phẳng Float32 [1, 3, 512, 512] theo Mean và Std chuẩn ImageNet
 */
export function preprocessImageToFloat32(rgba512: Uint8Array): Float32Array {
  const planeSize = OUT_SIZE * OUT_SIZE;
  const floatData = new Float32Array(3 * planeSize);

  for (let i = 0; i < planeSize; i++) {
    const idx = i * 4;
    floatData[i] = (rgba512[idx] / 255.0 - MEAN[0]) / STD[0];
    floatData[planeSize + i] = (rgba512[idx + 1] / 255.0 - MEAN[1]) / STD[1];
    floatData[2 * planeSize + i] = (rgba512[idx + 2] / 255.0 - MEAN[2]) / STD[2];
  }
  return floatData;
}

export function cleanSmallComponents(
  mask: Uint8Array,
  w: number,
  h: number,
  minSize: number
): Uint8Array {
  const out = new Uint8Array(w * h);
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  const component: number[] = [];

  for (let i = 0; i < w * h; i++) {
    if (mask[i] === 0 || visited[i]) continue;
    component.length = 0;
    let head = 0;
    let tail = 0;
    queue[tail++] = i;
    visited[i] = 1;

  while (head < tail) {
      const curr = queue[head++];
      component.push(curr);
      const cy = Math.floor(curr / w);
      const cx = curr - cy * w;

      for (let dy = -1; dy <= 1; dy++) {
        const ny = cy + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          if (nx < 0 || nx >= w) continue;
          const nIdx = ny * w + nx;
          if (mask[nIdx] > 0 && !visited[nIdx]) {
            visited[nIdx] = 1;
            queue[tail++] = nIdx;
          }
        }
      }
    }

    if (component.length >= minSize) {
      for (const idx of component) {
        out[idx] = 255;
      }
    }
  }

  return out;
}

export function skeletonizeMask(
  mask: Uint8Array,
  w: number,
  h: number
): Uint8Array {
  const bin = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    bin[i] = mask[i] > 0 ? 1 : 0;
  }

  const toClear: number[] = [];
  let changed = true;
  let iter = 0;

  while (changed && iter < 100) {
    changed = false;
    iter++;

    for (let step = 0; step < 2; step++) {
      toClear.length = 0;

      for (let y = 1; y < h - 1; y++) {
        const row = y * w;
        for (let x = 1; x < w - 1; x++) {
          const idx = row + x;
          if (bin[idx] === 0) continue;

          const p2 = bin[idx - w];
          const p3 = bin[idx - w + 1];
          const p4 = bin[idx + 1];
          const p5 = bin[idx + w + 1];
          const p6 = bin[idx + w];
          const p7 = bin[idx + w - 1];
          const p8 = bin[idx - 1];
          const p9 = bin[idx - w - 1];

          const bp = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (bp < 2 || bp > 6) continue;

          const ap =
            (p2 === 0 && p3 === 1 ? 1 : 0) +
            (p3 === 0 && p4 === 1 ? 1 : 0) +
            (p4 === 0 && p5 === 1 ? 1 : 0) +
            (p5 === 0 && p6 === 1 ? 1 : 0) +
            (p6 === 0 && p7 === 1 ? 1 : 0) +
            (p7 === 0 && p8 === 1 ? 1 : 0) +
            (p8 === 0 && p9 === 1 ? 1 : 0) +
            (p9 === 0 && p2 === 1 ? 1 : 0);

          if (ap !== 1) continue;

          if (step === 0) {
            if (p2 * p4 * p6 !== 0) continue;
            if (p4 * p6 * p8 !== 0) continue;
          } else {
            if (p2 * p4 * p8 !== 0) continue;
            if (p2 * p6 * p8 !== 0) continue;
          }

          toClear.push(idx);
        }
      }

      if (toClear.length > 0) {
        changed = true;
        for (const idx of toClear) {
          bin[idx] = 0;
        }
      }
    }
  }

  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (bin[i] > 0) out[i] = 255;
  }
  return out;
}

export function pruneSkeleton(skel: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(skel);
  const nbrs: [number, number][] = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  const degree = (x: number, y: number): number => {
    let d = 0;
    for (const [dy, dx] of nbrs) {
      const ny = y + dy;
      const nx = x + dx;
      if (ny >= 0 && ny < h && nx >= 0 && nx < w && out[ny * w + nx] > 0) d++;
    }
    return d;
  };

  for (let iter = 0; iter < SPUR_LEN; iter++) {
    let changed = false;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (out[y * w + x] > 0 && degree(x, y) === 1) {
          out[y * w + x] = 0;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return out;
}

function computePathLength(pts: [number, number][]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return len;
}

function subsamplePoints(pts: [number, number][], step = 4): [number, number][] {
  if (pts.length <= 3) return pts.slice();
  const res: [number, number][] = [pts[0]];
  for (let i = step; i < pts.length - 1; i += step) {
    res.push(pts[i]);
  }
  res.push(pts[pts.length - 1]);
  return res;
}

export function buildLinesFromSkeleton(
  skel: Uint8Array,
  w: number,
  h: number
): { lines: [number, number][][]; builtLines: BuiltSkeletonLine[] } {
  const visited = new Uint8Array(w * h);
  const nbrs: [number, number][] = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  const lines: [number, number][][] = [];
  const builtLines: BuiltSkeletonLine[] = [];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (skel[idx] === 0 || visited[idx]) continue;

      const currentPath: [number, number][] = [];
      let cx = x;
      let cy = y;

      while (true) {
        visited[cy * w + cx] = 1;
        currentPath.push([cx, cy]);

        let foundNext = false;
        for (const [dy, dx] of nbrs) {
          const ny = cy + dy;
          const nx = cx + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
            const nIdx = ny * w + nx;
            if (skel[nIdx] > 0 && !visited[nIdx]) {
              cx = nx;
              cy = ny;
              foundNext = true;
              break;
            }
          }
        }
        if (!foundNext) break;
      }

      if (currentPath.length >= MIN_LINE_LEN) {
        lines.push(currentPath);
        const sub = subsamplePoints(currentPath);
        const len = computePathLength(currentPath);
        builtLines.push({
          points: sub,
          orderedPixels: currentPath,
          subpaths: [currentPath],
          mainPath: currentPath,
          lengthPx: len,
          nBranches: 0,
        });
      }
    }
  }

  return { lines, builtLines };
}

export function nameLines(
  lines: [number, number][][],
  w: number,
  h: number
): PalmLineName[] {
  if (lines.length === 0) return [];

  const feats = lines.map((line, idx) => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;
    for (const [x, y] of line) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      sumX += x;
      sumY += y;
    }
    const len = line.length;
    const avgY = sumY / len;
    const avgX = sumX / len;
    const deltaX = maxX - minX;
    const deltaY = maxY - minY;
    return {
      idx,
      line,
      avgX,
      avgY,
      normX: avgX / w,
      normY: avgY / h,
      deltaX,
      deltaY,
      len,
    };
  });

  const assigned = new Map<number, PalmLineName>();
  const used = new Set<number>();

  // 1. Đường Sinh Mệnh (life): có deltaY lớn nhất
  let bestLifeIdx = -1;
  let maxLifeScore = -Infinity;
  for (const f of feats) {
    const score = f.deltaY * 1.5 + f.len * 0.8 + (f.normY > 0.4 ? 80 : 0);
    if (score > maxLifeScore) {
      maxLifeScore = score;
      bestLifeIdx = f.idx;
    }
  }
  if (bestLifeIdx !== -1) {
    assigned.set(bestLifeIdx, 'life');
    used.add(bestLifeIdx);
  }

  // 2. Trong các đường còn lại, sắp xếp theo chiều dọc từ trên xuống dưới
  const remaining = feats.filter((f) => !used.has(f.idx)).sort((a, b) => a.avgY - b.avgY);

  if (remaining.length > 0) {
    assigned.set(remaining[0].idx, 'heart');
    used.add(remaining[0].idx);
  }

  if (remaining.length > 1) {
    assigned.set(remaining[1].idx, 'head');
    used.add(remaining[1].idx);
  }

  return lines.map((_, i) => assigned.get(i) || 'other');
}

export class PalmLineInferenceService {
  private static instance: PalmLineInferenceService;
  private session: any = null;
  private isInitializing = false;

  static getInstance(): PalmLineInferenceService {
    if (!PalmLineInferenceService.instance) {
      PalmLineInferenceService.instance = new PalmLineInferenceService();
    }
    return PalmLineInferenceService.instance;
  }

  /**
   * Đảm bảo mô hình ONNX có sẵn trong bộ nhớ máy:
   * 1. Ưu tiên kiểm tra file đã nạp trong DocumentDirectory (kích thước > 90MB)
   * 2. Ưu tiên trích xuất từ Android Asset (mobile/android/app/src/main/assets/palm_lines.onnx)
   * 3. Fallback: Tải từ Cloudflare R2
   */
  async ensureModelFile(): Promise<string | null> {
    const localPath = `${FileSystem.documentDirectory}palm_lines.onnx`;
    try {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists && (info.size ?? 0) > 90_000_000) {
        return localPath;
      }

      // 1. Thử trích xuất từ Android asset nội bộ APK
      if (Platform.OS === 'android') {
        try {
          const assetUri = 'asset:///palm_lines.onnx';
          const assetInfo = await FileSystem.getInfoAsync(assetUri);
          if (assetInfo.exists) {
            console.log('Đang trích xuất mô hình ONNX từ Android asset nội bộ...');
            await FileSystem.copyAsync({ from: assetUri, to: localPath });
            const copied = await FileSystem.getInfoAsync(localPath);
            if (copied.exists && (copied.size ?? 0) > 90_000_000) {
              console.log('Đã nạp mô hình ONNX thành công từ APK asset:', localPath);
              return localPath;
            }
          }
        } catch (assetErr) {
          console.log('Không thể trích xuất trực tiếp từ asset:///palm_lines.onnx:', assetErr);
        }
      }

      // 2. Thử bundleDirectory trên iOS nếu có
      if (FileSystem.bundleDirectory) {
        try {
          const bundleUri = `${FileSystem.bundleDirectory}palm_lines.onnx`;
          const bundleInfo = await FileSystem.getInfoAsync(bundleUri);
          if (bundleInfo.exists) {
            console.log('Đang trích xuất mô hình ONNX từ iOS Bundle...');
            await FileSystem.copyAsync({ from: bundleUri, to: localPath });
            const copied = await FileSystem.getInfoAsync(localPath);
            if (copied.exists && (copied.size ?? 0) > 90_000_000) {
              return localPath;
            }
          }
        } catch (bundleErr) {
          console.log('Không thể sao chép từ bundleDirectory:', bundleErr);
        }
      }

      // 3. Fallback: Tải từ Cloudflare R2
      console.log('Đang tải mô hình ONNX từ Cloudflare R2...');
      const downloadRes = await FileSystem.downloadAsync(
        PALM_MODEL_REMOTE_URL,
        localPath
      );
      if (downloadRes.status === 200) {
        console.log('Tải mô hình ONNX thành công từ R2:', localPath);
        return localPath;
      }
    } catch (err) {
      console.warn('Không thể chuẩn bị file mô hình ONNX cục bộ:', err);
    }
    return null;
  }

  /**
   * Khởi tạo InferenceSession bằng onnxruntime-react-native
   */
  async getSession(): Promise<any> {
    if (this.session) return this.session;
    if (this.isInitializing) return null;

    this.isInitializing = true;
    try {
      const modelPath = await this.ensureModelFile();
      if (!modelPath) {
        this.isInitializing = false;
        return null;
      }

      // Nạp dynamic để không bị lỗi nếu chạy trên môi trường Web / Expo Go
      const ort = await import('onnxruntime-react-native');
      const cleanPath = Platform.OS === 'ios' ? modelPath.replace('file://', '') : modelPath;
      this.session = await ort.InferenceSession.create(cleanPath);
      console.log('ONNX InferenceSession đã sẵn sàng trên thiết bị.');
      return this.session;
    } catch (err) {
      console.warn('Khởi tạo ONNX session trên client thất bại (sử dụng fallback):', err);
      return null;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Chạy On-Device Inference trích xuất toạ độ các đường chỉ tay chính từ ảnh chụp
   */
  async runInference(imageUri: string): Promise<PalmLineDto[]> {
    const session = await this.getSession();
    if (!session) {
      throw new Error('InferenceSession chưa sẵn sàng.');
    }

    // Đọc ảnh base64 từ file local URI
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (!base64) {
      throw new Error('Không thể đọc dữ liệu ảnh từ ' + imageUri);
    }

    const rawBytes = base64ToUint8Array(base64);
    const decoded = jpeg.decode(rawBytes, { useTArray: true, formatAsRGBA: true });
    if (!decoded || !decoded.data || decoded.width <= 0 || decoded.height <= 0) {
      throw new Error('Giải mã ảnh JPEG thất bại');
    }

    // Resize ảnh về 512x512
    const rgba512 = resizeRgbaTo512(decoded.data, decoded.width, decoded.height, OUT_SIZE, OUT_SIZE);
    // Chuẩn hóa RGB theo Mean/Std
    const floatData = preprocessImageToFloat32(rgba512);

    // Chuẩn bị tensor và feed vào session
    const ort = await import('onnxruntime-react-native');
    const inputTensor = new ort.Tensor('float32', floatData, [1, 3, OUT_SIZE, OUT_SIZE]);
    const inputName = session.inputNames?.[0] || 'image';
    const feeds: Record<string, any> = { [inputName]: inputTensor };

    const outputMap = await session.run(feeds);
    const outputName = session.outputNames?.[0] || 'logits';
    const outputTensor = outputMap[outputName] || outputMap.logits;
    if (!outputTensor || !outputTensor.data) {
      throw new Error('Không nhận được dữ liệu logits từ mô hình');
    }

    const logits = outputTensor.data as Float32Array;
    return this.processModelOutput(logits);
  }

  /**
   * Xử lý tensor logits để trích xuất 3 đường chỉ tay chính
   */
  processModelOutput(logits: Float32Array): PalmLineDto[] {
    const planeSize = OUT_SIZE * OUT_SIZE;
    const rawMask = new Uint8Array(planeSize);
    for (let i = 0; i < planeSize; i++) {
      const prob = 1.0 / (1.0 + Math.exp(-logits[i]));
      if (prob > THRESH) {
        rawMask[i] = 255;
      }
    }

    const cleanedMask = cleanSmallComponents(rawMask, OUT_SIZE, OUT_SIZE, MIN_MASK_SIZE);
    const skel = skeletonizeMask(cleanedMask, OUT_SIZE, OUT_SIZE);
    const pruned = pruneSkeleton(skel, OUT_SIZE, OUT_SIZE);
    const { lines, builtLines } = buildLinesFromSkeleton(pruned, OUT_SIZE, OUT_SIZE);
    const names = nameLines(lines, OUT_SIZE, OUT_SIZE);

    const palmLines: PalmLineDto[] = [];
    for (let i = 0; i < builtLines.length; i++) {
      const b = builtLines[i];
      if (b.orderedPixels.length < 2) continue;

      const sampledNorm: [number, number][] = b.points.map(([px, py]) => [
        Number((px / OUT_SIZE).toFixed(4)),
        Number((py / OUT_SIZE).toFixed(4)),
      ]);

      palmLines.push({
        name: names[i] ?? 'other',
        points: sampledNorm,
        lengthRel: Number((b.lengthPx / OUT_SIZE).toFixed(3)),
        curvature: 1.1,
        branches: b.nBranches,
      });
    }

    // CHỈ giữ lại 3 đường chính: heart, head, life
    const corePalmLines = palmLines.filter(
      (l) => l.name === 'heart' || l.name === 'head' || l.name === 'life'
    );
    const priorityOrder: Record<string, number> = { heart: 0, head: 1, life: 2 };
    corePalmLines.sort((a, b) => (priorityOrder[a.name] ?? 99) - (priorityOrder[b.name] ?? 99));

    return corePalmLines;
  }
}

export const palmLineInferenceService = PalmLineInferenceService.getInstance();
export default palmLineInferenceService;
