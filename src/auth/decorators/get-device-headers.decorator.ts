import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";
import { DEVICE_ID_HEADER, DEVICE_TYPE_HEADER } from "../constants/headers";
import { DeviceHeadersDto } from "../dto/device-headers.dto";
import { DeviceType } from "prisma/generated/enums";

export const GetDeviceHeaders = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): DeviceHeadersDto => {
    const headers = ctx.switchToHttp().getRequest().headers;
    if (!headers[DEVICE_ID_HEADER] || !headers[DEVICE_TYPE_HEADER]) {
      throw new BadRequestException("Device ID and type are required");
    }

    if (!Object.values(DeviceType).includes(headers[DEVICE_TYPE_HEADER])) {
      throw new BadRequestException("Invalid device type");
    }
    return {
      deviceId: headers[DEVICE_ID_HEADER],
      deviceType: headers[DEVICE_TYPE_HEADER],
    };
  },
);
