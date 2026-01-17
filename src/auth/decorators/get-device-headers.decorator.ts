import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { DEVICE_ID_HEADER, DEVICE_TYPE_HEADER } from "../constants/headers";
import { DeviceHeadersDto } from "../dto/device-headers.dto";

export const GetDeviceHeaders = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): DeviceHeadersDto => {
    const headers = ctx.switchToHttp().getRequest().headers;
    return {
      deviceId: headers[DEVICE_ID_HEADER],
      deviceType: headers[DEVICE_TYPE_HEADER],
    };
  },
);
