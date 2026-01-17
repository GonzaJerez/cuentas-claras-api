import { DeviceType } from "prisma/generated/enums";

export class DeviceHeadersDto {
  deviceId: string;
  deviceType: DeviceType;
}
