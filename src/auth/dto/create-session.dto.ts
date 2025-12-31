import { IsEnum, IsString } from "class-validator";
import { DeviceType } from "prisma/generated/enums";

export class CreateSessionDto {
  @IsString()
  deviceId: string;

  @IsEnum(DeviceType)
  deviceType: DeviceType;
}
