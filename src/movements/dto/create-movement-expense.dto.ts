import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsArray,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePaymentDto {
  @IsUUID()
  memberId: string;

  @IsNumber()
  amount: number;
}

export class CreateSplitDto {
  @IsUUID()
  memberId: string;

  @IsNumber()
  amount: number;
}

export class CreateExpenseDto {
  @IsUUID()
  categoryId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateMovementExpenseDto {
  @IsUUID()
  groupId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  // @IsArray()
  // @IsString({ each: true })
  // @IsOptional()
  // imageUris?: string[];

  @IsDateString()
  @IsOptional()
  date?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseDto)
  expenses: CreateExpenseDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments: CreatePaymentDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSplitDto)
  splits: CreateSplitDto[];
}
