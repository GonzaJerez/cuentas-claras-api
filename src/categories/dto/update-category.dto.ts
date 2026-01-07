import { PartialType } from "@nestjs/mapped-types";
import { CreateCategoryDto } from "./create-category.dto";
import { CategoryState } from "prisma/generated/enums";
import { IsEnum, IsOptional } from "class-validator";

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @IsEnum(CategoryState)
  @IsOptional()
  state?: CategoryState;
}
