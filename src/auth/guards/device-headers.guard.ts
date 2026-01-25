import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { DEVICE_ID_HEADER, DEVICE_TYPE_HEADER } from "../constants/headers";
import { DeviceType } from "prisma/generated/enums";

@Injectable()
export class DeviceHeadersGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // const headers = context.switchToHttp().getRequest().headers;
    // if (!headers[DEVICE_ID_HEADER] || !headers[DEVICE_TYPE_HEADER]) {
    //   throw new BadRequestException("Device ID and type are required");
    // }
    // if (!Object.values(DeviceType).includes(headers[DEVICE_TYPE_HEADER])) {
    //   throw new BadRequestException("Invalid device type");
    // }
    // return headers[DEVICE_ID_HEADER] && headers[DEVICE_TYPE_HEADER];
    return true;
  }
}
