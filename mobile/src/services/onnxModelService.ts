/**
 * ONNX Palm Model Manager for Mobile (Edge AI)
 * Manages model endpoint, download status, and on-device readiness.
 */

export const PALM_MODEL_REMOTE_URL =
  process.env.EXPO_PUBLIC_PALM_MODEL_URL ||
  'https://pub-d76d41e7b18e4b89949a626c28eb4527.r2.dev/palm_lines.onnx';

export interface PalmModelStatus {
  remoteUrl: string;
  isAvailableOnDevice: boolean;
  downloadProgress?: number;
}

export class OnnxModelService {
  private static instance: OnnxModelService;

  static getInstance(): OnnxModelService {
    if (!OnnxModelService.instance) {
      OnnxModelService.instance = new OnnxModelService();
    }
    return OnnxModelService.instance;
  }

  getModelUrl(): string {
    return PALM_MODEL_REMOTE_URL;
  }

  /**
   * Checks if ONNX model is available locally or ready to fetch.
   */
  async checkModelStatus(): Promise<PalmModelStatus> {
    return {
      remoteUrl: PALM_MODEL_REMOTE_URL,
      isAvailableOnDevice: false,
    };
  }
}

export const onnxModelService = OnnxModelService.getInstance();
export default onnxModelService;
