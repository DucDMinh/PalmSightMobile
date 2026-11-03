import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Types } from "mongoose";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { EarnService } from "./earn.service";
import {
  CreateAdRewardTicketDto,
  EarnStatusResponseDto,
  CheckinResponseDto,
  CheckinRestoreResponseDto,
  SpinResponseDto,
  AdRewardTicketResponseDto,
  ClaimAdRewardResponseDto,
} from "@palmsight/shared";

class DeviceBodyDto {
  deviceId?: string;
}

@Controller("currency")
@UseGuards(JwtAuthGuard)
export class EarnController {
  constructor(private readonly earnService: EarnService) {}

  @Get("earn")
  getEarnStatus(
    @CurrentUser("id") userId: string,
    @Query("deviceId") queryDeviceId?: string,
    @Headers("x-device-id") headerDeviceId?: string
  ): Promise<EarnStatusResponseDto> {
    const deviceId = queryDeviceId || headerDeviceId;
    return this.earnService.getEarnStatus(new Types.ObjectId(userId), deviceId);
  }

  @Post("checkin")
  @HttpCode(HttpStatus.OK)
  checkin(
    @CurrentUser("id") userId: string,
    @Body() body?: DeviceBodyDto,
    @Headers("x-device-id") headerDeviceId?: string
  ): Promise<CheckinResponseDto> {
    const deviceId = body?.deviceId || headerDeviceId;
    return this.earnService.checkin(new Types.ObjectId(userId), deviceId);
  }

  @Post("checkin/restore")
  @HttpCode(HttpStatus.OK)
  restoreCheckin(
    @CurrentUser("id") userId: string,
    @Body() body?: DeviceBodyDto,
    @Headers("x-device-id") headerDeviceId?: string
  ): Promise<CheckinRestoreResponseDto> {
    const deviceId = body?.deviceId || headerDeviceId;
    return this.earnService.restoreCheckin(new Types.ObjectId(userId), deviceId);
  }

  @Post("spin")
  @HttpCode(HttpStatus.OK)
  spinFree(
    @CurrentUser("id") userId: string,
    @Body() body?: DeviceBodyDto,
    @Headers("x-device-id") headerDeviceId?: string
  ): Promise<SpinResponseDto> {
    const deviceId = body?.deviceId || headerDeviceId;
    return this.earnService.spinFree(new Types.ObjectId(userId), deviceId);
  }

  @Post("paid-spin")
  @HttpCode(HttpStatus.OK)
  spinPaid(@CurrentUser("id") userId: string): Promise<SpinResponseDto> {
    return this.earnService.spinPaid(new Types.ObjectId(userId));
  }

  @Post("ad-rewards")
  @HttpCode(HttpStatus.CREATED)
  createAdRewardTicket(
    @CurrentUser("id") userId: string,
    @Body() body: CreateAdRewardTicketDto,
    @Headers("x-device-id") headerDeviceId?: string
  ): Promise<AdRewardTicketResponseDto> {
    const deviceId = body?.deviceId || headerDeviceId;
    return this.earnService.createAdRewardTicket(
      new Types.ObjectId(userId),
      body.kind,
      deviceId
    );
  }

  @Post("ad-rewards/:id/claim")
  @HttpCode(HttpStatus.OK)
  claimAdRewardTicket(
    @CurrentUser("id") userId: string,
    @Param("id") ticketId: string
  ): Promise<ClaimAdRewardResponseDto> {
    return this.earnService.claimAdRewardTicket(
      new Types.ObjectId(userId),
      ticketId
    );
  }

  @Delete("ad-rewards/:id")
  @HttpCode(HttpStatus.OK)
  releaseAdRewardTicket(
    @CurrentUser("id") userId: string,
    @Param("id") ticketId: string
  ): Promise<{ ok: boolean }> {
    return this.earnService.releaseAdRewardTicket(
      new Types.ObjectId(userId),
      ticketId
    );
  }
}
