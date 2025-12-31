import { IsBoolean, IsEnum, IsOptional, IsUUID } from "class-validator";
import { MemberState } from "prisma/generated/enums";

export class UpdateMemberDto {
  @IsUUID()
  id: string;

  @IsBoolean()
  @IsOptional()
  notifications?: boolean;

  @IsEnum(MemberState)
  @IsOptional()
  state?: MemberState;
}
