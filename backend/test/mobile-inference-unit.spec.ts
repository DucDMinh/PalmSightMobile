import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///mock/documents/',
  bundleDirectory: 'file:///mock/bundle/',
  getInfoAsync: vi.fn(),
  downloadAsync: vi.fn(),
  copyAsync: vi.fn(),
  readAsStringAsync: vi.fn(),
  EncodingType: { Base64: 'base64' },
}));

vi.mock('onnxruntime-react-native', () => ({
  InferenceSession: {
    create: vi.fn(),
  },
  Tensor: class {
    constructor(public type: string, public data: any, public dims: number[]) {}
  },
}));

import {
  base64ToUint8Array,
  resizeRgbaTo512,
  preprocessImageToFloat32,
  cleanSmallComponents,
  skeletonizeMask,
  pruneSkeleton,
  buildLinesFromSkeleton,
  nameLines,
  palmLineInferenceService,
} from '../../mobile/src/services/palmLineInferenceService';
import * as FileSystem from 'expo-file-system/legacy';

describe('PalmLineInferenceService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('base64ToUint8Array', () => {
    it('correctly decodes standard ASCII base64 string', () => {
      // "Hello World" in base64 is "SGVsbG8gV29ybGQ="
      const bytes = base64ToUint8Array('SGVsbG8gV29ybGQ=');
      const text = String.fromCharCode(...bytes);
      expect(text).toBe('Hello World');
    });

    it('handles base64 strings with data URI scheme prefix', () => {
      const bytes = base64ToUint8Array('data:image/jpeg;base64,SGVsbG8=');
      const text = String.fromCharCode(...bytes);
      expect(text).toBe('Hello');
    });
  });

  describe('resizeRgbaTo512', () => {
    it('scales and crops rectangular image to 512x512x4 bytes', () => {
      const srcW = 100;
      const srcH = 200;
      const srcData = new Uint8Array(srcW * srcH * 4);
      // Fill with test color: red = 200, green = 150, blue = 100, alpha = 255
      for (let i = 0; i < srcW * srcH; i++) {
        srcData[i * 4] = 200;
        srcData[i * 4 + 1] = 150;
        srcData[i * 4 + 2] = 100;
        srcData[i * 4 + 3] = 255;
      }

      const resized = resizeRgbaTo512(srcData, srcW, srcH, 512, 512);
      expect(resized.length).toBe(512 * 512 * 4);
      expect(resized[0]).toBe(200);
      expect(resized[1]).toBe(150);
      expect(resized[2]).toBe(100);
      expect(resized[3]).toBe(255);
    });
  });

  describe('preprocessImageToFloat32', () => {
    it('normalizes RGBA values using ImageNet mean & std', () => {
      const rgba = new Uint8Array(512 * 512 * 4);
      // Fill first pixel with R=128, G=128, B=128
      rgba[0] = 128;
      rgba[1] = 128;
      rgba[2] = 128;
      rgba[3] = 255;

      const floatData = preprocessImageToFloat32(rgba);
      expect(floatData.length).toBe(3 * 512 * 512);

      const planeSize = 512 * 512;
      const expectedR = (128 / 255 - 0.485) / 0.229;
      const expectedG = (128 / 255 - 0.456) / 0.224;
      const expectedB = (128 / 255 - 0.406) / 0.225;

      expect(floatData[0]).toBeCloseTo(expectedR, 3);
      expect(floatData[planeSize]).toBeCloseTo(expectedG, 3);
      expect(floatData[2 * planeSize]).toBeCloseTo(expectedB, 3);
    });
  });

  describe('cleanSmallComponents & skeletonizeMask', () => {
    it('removes components smaller than threshold and preserves large connected components', () => {
      const w = 50;
      const h = 50;
      const mask = new Uint8Array(w * h);

      // Create a small isolated component of 5 pixels
      for (let i = 0; i < 5; i++) {
        mask[i] = 255;
      }

      // Create a large line component of 200 pixels
      for (let y = 10; y < 30; y++) {
        for (let x = 10; x < 20; x++) {
          mask[y * w + x] = 255;
        }
      }

      const cleaned = cleanSmallComponents(mask, w, h, 50);
      // Small component must be removed
      expect(cleaned[0]).toBe(0);
      // Large component must be preserved
      expect(cleaned[15 * w + 15]).toBe(255);

      const skel = skeletonizeMask(cleaned, w, h);
      expect(skel.length).toBe(w * h);
    });
  });

  describe('ensureModelFile', () => {
    it('reuses existing local model file if size > 90MB', async () => {
      vi.mocked(FileSystem.getInfoAsync).mockResolvedValueOnce({
        exists: true,
        size: 95_000_000,
        isDirectory: false,
        uri: 'file:///mock/documents/palm_lines.onnx',
      } as any);

      const path = await palmLineInferenceService.ensureModelFile();
      expect(path).toBe('file:///mock/documents/palm_lines.onnx');
      expect(FileSystem.downloadAsync).not.toHaveBeenCalled();
    });

    it('extracts from Android APK asset when local cache is empty', async () => {
      // First check localPath -> does not exist
      vi.mocked(FileSystem.getInfoAsync)
        .mockResolvedValueOnce({ exists: false } as any) // local check
        .mockResolvedValueOnce({ exists: true } as any) // asset:/// check
        .mockResolvedValueOnce({ exists: true, size: 97_700_000 } as any); // copied check

      const path = await palmLineInferenceService.ensureModelFile();
      expect(FileSystem.copyAsync).toHaveBeenCalledWith({
        from: 'asset:///palm_lines.onnx',
        to: 'file:///mock/documents/palm_lines.onnx',
      });
      expect(path).toBe('file:///mock/documents/palm_lines.onnx');
      expect(FileSystem.downloadAsync).not.toHaveBeenCalled();
    });
  });

  describe('processModelOutput', () => {
    it('extracts heart, head, life lines from logits mask', () => {
      const planeSize = 512 * 512;
      const logits = new Float32Array(planeSize).fill(-10); // all negative logits (prob ~ 0)

      // Draw 3 distinct lines in logits (> 0 logits -> prob > 0.5 > THRESH)
      // 1. Heart line (top horizontal)
      for (let x = 100; x < 350; x++) {
        logits[120 * 512 + x] = 5.0;
      }
      // 2. Head line (middle horizontal)
      for (let x = 100; x < 350; x++) {
        logits[240 * 512 + x] = 5.0;
      }
      // 3. Life line (curving down, high deltaY)
      for (let y = 150; y < 420; y++) {
        logits[y * 512 + 130] = 5.0;
      }

      const results = palmLineInferenceService.processModelOutput(logits);
      expect(results.length).toBeGreaterThanOrEqual(1);
      // Valid line names must be within heart, head, life
      for (const line of results) {
        expect(['heart', 'head', 'life']).toContain(line.name);
        expect(line.points.length).toBeGreaterThan(0);
        expect(line.lengthRel).toBeGreaterThan(0);
      }
    });
  });
});
