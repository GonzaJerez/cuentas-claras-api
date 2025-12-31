import { IsString, IsUUID } from "class-validator";

export class CreateCategoryDto {
  @IsUUID()
  groupId: string;

  @IsString()
  name: string;

  @IsString()
  icon: string;
}
