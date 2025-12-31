import { PartialType } from "@nestjs/mapped-types";
import { CreateGroupDto } from "./create-group.dto";
import { IsArray, IsEnum, IsOptional, IsString } from "class-validator";
import { SplitType } from "prisma/generated/enums";
import { UpdateMemberDto } from "src/members/dto/update-member.dto";

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SplitType)
  @IsOptional()
  splitType?: SplitType;

  @IsArray()
  @IsOptional()
  membersToUpdate?: UpdateMemberDto[];
}
