import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import type { PalmLineDto, PalmLineName } from '@palmsight/shared';

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

  // 1. Đường Sinh Mệnh (life): có độ kéo dọc deltaY lớn nhất, ôm quanh gò Kim Tinh
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

  // Đường trên cùng là Tâm Đạo (heart)
  if (remaining.length > 0) {
    assigned.set(remaining[0].idx, 'heart');
    used.add(remaining[0].idx);
  }

  // Đường ở giữa là Trí Đạo (head)
  if (remaining.length > 1) {
    assigned.set(remaining[1].idx, 'head');
    used.add(remaining[1].idx);
  }

  return lines.map((_, i) => assigned.get(i) || 'other');
}

@Injectable()
export class PalmLineOnnxService {
  private readonly logger = new Logger(PalmLineOnnxService.name);
  private sessionPromise: Promise<any> | null = null;
  private readonly modelUrl =
    'https://pub-d76d41e7b18e4b89949a626c28eb4527.r2.dev/palm_lines.onnx';

  private async getSession(): Promise<any> {
    if (!this.sessionPromise) {
      this.sessionPromise = (async () => {
        const modelDir = path.resolve('backend/models');
        if (!fs.existsSync(modelDir)) {
          fs.mkdirSync(modelDir, { recursive: true });
        }
        const modelPath = path.join(modelDir, 'palm_lines.onnx');

        if (!fs.existsSync(modelPath) || fs.statSync(modelPath).size < 90_000_000) {
          this.logger.log(`Downloading ONNX model from Cloudflare R2...`);
          const res = await fetch(this.modelUrl);
          if (!res.ok) {
            throw new Error(`Failed to fetch ONNX model from R2: ${res.statusText}`);
          }
          const buf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(modelPath, buf);
          this.logger.log(`Downloaded ONNX model (${buf.length} bytes) to ${modelPath}`);
        }

        const ort = await import('onnxruntime-web');
        const modelBuf = fs.readFileSync(modelPath);
        this.logger.log(`Initializing ONNX runtime session...`);
        return await ort.InferenceSession.create(modelBuf, {
          executionProviders: ['wasm'],
        });
      })();
    }
    return this.sessionPromise;
  }

  async extractPalmLinesAndAnnotate(
    imageBuffer: Buffer
  ): Promise<{
    palmLines: PalmLineDto[];
    annotatedBuffer: Buffer;
  } | null> {
    try {
      const session = await this.getSession();

      // Chuẩn bị ảnh RGB 512x512 qua Sharp
      const { data: rawRgb } = await sharp(imageBuffer)
        .resize(OUT_SIZE, OUT_SIZE, { fit: 'cover' })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const planeSize = OUT_SIZE * OUT_SIZE;
      const floatData = new Float32Array(3 * planeSize);

      for (let i = 0; i < planeSize; i++) {
        const idx = i * 3;
        floatData[i] = (rawRgb[idx] / 255.0 - MEAN[0]) / STD[0];
        floatData[planeSize + i] = (rawRgb[idx + 1] / 255.0 - MEAN[1]) / STD[1];
        floatData[2 * planeSize + i] = (rawRgb[idx + 2] / 255.0 - MEAN[2]) / STD[2];
      }

      const ort = await import('onnxruntime-web');
      const inputTensor = new ort.Tensor('float32', floatData, [1, 3, OUT_SIZE, OUT_SIZE]);
      const outputs = await session.run({ image: inputTensor });
      const logits = outputs.logits.data as Float32Array;

      // Tạo mặt nạ nhị phân dựa trên xác suất sigmoid > THRESH
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

      // Trích xuất mảng palmLines toạ độ chuẩn hoá 0..1 từ ONNX
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

      // Vẽ đè các nét vẽ ONNX màu đỏ/hồng trực tiếp lên ảnh bàn tay
      const overlayRgb = Buffer.from(rawRgb);
      for (let i = 0; i < planeSize; i++) {
        if (cleanedMask[i] > 0 || pruned[i] > 0) {
          const idx = i * 3;
          overlayRgb[idx] = 255;     // R
          overlayRgb[idx + 1] = 25;  // G
          overlayRgb[idx + 2] = 50;  // B
        }
      }

      const annotatedBuffer = await sharp(overlayRgb, {
        raw: { width: OUT_SIZE, height: OUT_SIZE, channels: 3 },
      })
        .jpeg({ quality: 90 })
        .toBuffer();

      this.logger.log(
        `ONNX extraction successful: ${palmLines.length} lines detected, mask rendered.`
      );

      // CHỈ giữ lại 3 đường chính: heart, head, life
      const corePalmLines = palmLines.filter(
        (l) => l.name === 'heart' || l.name === 'head' || l.name === 'life'
      );
      const priorityOrder: Record<string, number> = { heart: 0, head: 1, life: 2 };
      corePalmLines.sort((a, b) => (priorityOrder[a.name] ?? 99) - (priorityOrder[b.name] ?? 99));

      return {
        palmLines: corePalmLines,
        annotatedBuffer,
      };
    } catch (err: any) {
      this.logger.error(`Error running ONNX palm lines inference: ${err.message}`);
      return null;
    }
  }
}
