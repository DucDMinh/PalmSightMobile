import httpService from './httpService';
import { getEndpoints } from '../consts/apiUrl';
import type {
  RegisterRequestDto,
  RegisterResponseDto,
  VerifyEmailRequestDto,
  ResendVerificationRequestDto,
  LoginRequestDto,
  GoogleAuthRequestDto,
  FacebookAuthRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  AuthResponseDto,
} from '@palmsight/shared';

class AuthService {
  async postRegister(data: RegisterRequestDto): Promise<RegisterResponseDto> {
    const endpoints = getEndpoints();
    const response = await httpService.post<RegisterResponseDto>(endpoints.AUTH_REGISTER_URL, data);
    return response.data;
  }

  async postResendVerification(data: ResendVerificationRequestDto): Promise<void> {
    const endpoints = getEndpoints();
    await httpService.post(endpoints.AUTH_RESEND_VERIFICATION_URL, data);
  }

  async postVerifyEmail(data: VerifyEmailRequestDto): Promise<AuthResponseDto> {
    const endpoints = getEndpoints();
    const response = await httpService.post<AuthResponseDto>(endpoints.AUTH_VERIFY_EMAIL_URL, data);
    return response.data;
  }

  async postLogin(data: LoginRequestDto): Promise<AuthResponseDto> {
    const endpoints = getEndpoints();
    const response = await httpService.post<AuthResponseDto>(endpoints.AUTH_LOGIN_URL, data);
    return response.data;
  }

  async postGoogleLogin(data: GoogleAuthRequestDto): Promise<AuthResponseDto> {
    const endpoints = getEndpoints();
    const response = await httpService.post<AuthResponseDto>(endpoints.AUTH_GOOGLE_URL, data);
    return response.data;
  }

  async postFacebookLogin(data: FacebookAuthRequestDto): Promise<AuthResponseDto> {
    const endpoints = getEndpoints();
    const response = await httpService.post<AuthResponseDto>(endpoints.AUTH_FACEBOOK_URL, data);
    return response.data;
  }

  async postForgotPassword(data: ForgotPasswordRequestDto): Promise<void> {
    const endpoints = getEndpoints();
    await httpService.post(endpoints.AUTH_FORGOT_PASSWORD_URL, data);
  }

  async postResetPassword(data: ResetPasswordRequestDto): Promise<void> {
    const endpoints = getEndpoints();
    await httpService.post(endpoints.AUTH_RESET_PASSWORD_URL, data);
  }

  async postLogout(): Promise<void> {
    const endpoints = getEndpoints();
    try {
      await httpService.post(endpoints.AUTH_LOGOUT_URL, {});
    } catch {}
    await httpService.clearToken();
  }
}

export const authService = new AuthService();
export default authService;
