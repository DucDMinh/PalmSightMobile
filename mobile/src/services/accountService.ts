import httpService from './httpService';
import { getEndpoints } from '../consts/apiUrl';
import type {
  MeResponseDto,
  ChangePasswordRequestDto,
  EnterReferralRequestDto,
  EnterReferralResponseDto,
  ReferralListResponseDto,
  CreditTransactionListResponseDto,
} from '@palmsight/shared';

class AccountService {
  async getMe(): Promise<MeResponseDto> {
    const endpoints = getEndpoints();
    const response = await httpService.get<MeResponseDto>(endpoints.ME_URL);
    return response.data;
  }

  async changePassword(data: ChangePasswordRequestDto): Promise<void> {
    const endpoints = getEndpoints();
    await httpService.put(endpoints.ME_PASSWORD_URL, data);
  }

  async enterReferral(code: string): Promise<EnterReferralResponseDto> {
    const endpoints = getEndpoints();
    const payload: EnterReferralRequestDto = { code };
    const response = await httpService.post<EnterReferralResponseDto>(
      endpoints.ME_REFERRAL_URL,
      payload
    );
    return response.data;
  }

  async getReferrals(cursor?: string | null, limit = 20): Promise<ReferralListResponseDto> {
    const endpoints = getEndpoints();
    const params: Record<string, any> = { limit };
    if (cursor) params.cursor = cursor;
    const response = await httpService.get<ReferralListResponseDto>(endpoints.ME_REFERRALS_URL, {
      params,
    });
    return response.data;
  }

  async getCreditTransactions(
    cursor?: string | null,
    limit = 20
  ): Promise<CreditTransactionListResponseDto> {
    const endpoints = getEndpoints();
    const params: Record<string, any> = { limit };
    if (cursor) params.cursor = cursor;
    const response = await httpService.get<CreditTransactionListResponseDto>(
      endpoints.ME_CREDIT_TRANSACTIONS_URL,
      { params }
    );
    return response.data;
  }
}

export const accountService = new AccountService();
export default accountService;
