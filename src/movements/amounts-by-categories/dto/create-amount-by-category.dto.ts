import { IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateAmountByCategoryDto {
  @IsUUID()
  categoryId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}
