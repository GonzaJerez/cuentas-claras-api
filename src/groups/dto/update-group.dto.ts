import { PartialType } from "@nestjs/mapped-types";
import { CreateGroupDto } from "./create-group.dto";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { SplitType } from "prisma/generated/enums";
import { UpdateMemberWithGroupDto } from "src/members/dto/update-member-with-group.dto";
import { Type } from "class-transformer";

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SplitType)
  @IsOptional()
  splitType?: SplitType;

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateMemberWithGroupDto)
  membersToUpdate?: UpdateMemberWithGroupDto[];
}
