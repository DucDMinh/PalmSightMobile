import httpService from './httpService';
import { getEndpoints } from '../consts/apiUrl';
import { getFingerprint } from '../helpers/fingerprint';
import { uuidV4 } from '../helpers/common';
import type {
  CreateReadingResponseDto,
  CreateGuestReadingResponseDto,
  ReadingDto,
  ReadingListResponseDto,
  GuestReadingPreviewDto,
  ReadingSchool,
  HandOrientation,
  PalmLineDto,
} from '@palmsight/shared';

export interface CreateReadingParams {
  school: ReadingSchool;
  hand: HandOrientation;
  topics?: string[];
  aiConsent: boolean;
  imageUri: string;
  imageName?: string;
  imageType?: string;
  annotatedImageUri?: string | null;
  palmLines?: PalmLineDto[] | null;
  idempotencyKey?: string;
}

export class ReadingsService {
  async createReading(params: CreateReadingParams): Promise<CreateReadingResponseDto> {
    const endpoints = getEndpoints();
    const idempotencyKey = params.idempotencyKey || uuidV4();
    const formData = new FormData();

    formData.append('school', params.school);
    formData.append('hand', params.hand);
    formData.append('aiConsent', String(params.aiConsent));

    if (params.topics && params.topics.length > 0) {
      formData.append('topics', params.topics.join(','));
    }

    const filename = params.imageName || params.imageUri.split('/').pop() || 'palm.jpg';
    formData.append('image', {
      uri: params.imageUri,
      name: filename,
      type: params.imageType || 'image/jpeg',
    } as any);

    if (params.annotatedImageUri) {
      formData.append('annotatedImage', {
        uri: params.annotatedImageUri,
        name: 'annotated.jpg',
        type: 'image/jpeg',
      } as any);
    }

    if (params.palmLines && params.palmLines.length > 0) {
      formData.append('palmLines', JSON.stringify(params.palmLines));
    }

    const response = await httpService.axios.post<CreateReadingResponseDto>(
      endpoints.READINGS_URL,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Idempotency-Key': idempotencyKey,
        },
        timeout: 60000,
      }
    );
    return response.data;
  }

  async createGuestReading(params: CreateReadingParams): Promise<CreateGuestReadingResponseDto> {
    const endpoints = getEndpoints();
    const idempotencyKey = params.idempotencyKey || uuidV4();
    const fingerprint = await getFingerprint();
    const formData = new FormData();

    formData.append('school', params.school);
    formData.append('hand', params.hand);
    formData.append('aiConsent', String(params.aiConsent));
    formData.append('fingerprint', fingerprint);

    if (params.topics && params.topics.length > 0) {
      formData.append('topics', params.topics.join(','));
    }

    const filename = params.imageName || params.imageUri.split('/').pop() || 'palm.jpg';
    formData.append('image', {
      uri: params.imageUri,
      name: filename,
      type: params.imageType || 'image/jpeg',
    } as any);

    if (params.annotatedImageUri) {
      formData.append('annotatedImage', {
        uri: params.annotatedImageUri,
        name: 'annotated.jpg',
        type: 'image/jpeg',
      } as any);
    }

    if (params.palmLines && params.palmLines.length > 0) {
      formData.append('palmLines', JSON.stringify(params.palmLines));
    }

    const response = await httpService.axios.post<CreateGuestReadingResponseDto>(
      endpoints.READINGS_GUEST_URL,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Idempotency-Key': idempotencyKey,
        },
        timeout: 60000,
      }
    );
    return response.data;
  }

  async getReadingById(readingId: string): Promise<ReadingDto> {
    const endpoints = getEndpoints();
    const response = await httpService.get<ReadingDto>(`${endpoints.READINGS_URL}/${readingId}`);
    return response.data;
  }

  async getGuestReadingPreview(token: string): Promise<GuestReadingPreviewDto> {
    const endpoints = getEndpoints();
    const response = await httpService.get<GuestReadingPreviewDto>(
      `${endpoints.READINGS_GUEST_URL}/${token}`
    );
    return response.data;
  }

  async getReadings(cursor?: string | null, limit = 20): Promise<ReadingListResponseDto> {
    const endpoints = getEndpoints();
    const params: Record<string, any> = { limit };
    if (cursor) params.cursor = cursor;
    const response = await httpService.get<ReadingListResponseDto>(endpoints.READINGS_URL, {
      params,
    });
    return response.data;
  }

  async deleteReading(readingId: string): Promise<void> {
    const endpoints = getEndpoints();
    await httpService.delete(`${endpoints.READINGS_URL}/${readingId}`);
  }
}

export const readingsService = new ReadingsService();
export default readingsService;
