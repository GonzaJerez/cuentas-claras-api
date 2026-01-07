import { IsNumber, IsOptional, IsUUID, Min } from "class-validator";
import { UpdateMemberDto } from "./update-member.dto";

export class UpdateMemberWithGroupDto extends UpdateMemberDto {
  @IsUUID()
  id: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultSplit: number;
}
