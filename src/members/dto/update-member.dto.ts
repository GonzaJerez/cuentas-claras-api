import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { MemberState } from "prisma/generated/enums";

export class UpdateMemberDto {
  @IsBoolean()
  @IsOptional()
  notifications?: boolean;

  @IsEnum(MemberState)
  @IsOptional()
  state?: MemberState;
}
