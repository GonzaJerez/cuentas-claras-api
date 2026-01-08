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

export class ExpensePaymentDto {
  @IsUUID()
  memberId: string;

  @IsNumber()
  amount: number;
}

export class ExpenseSplitDto {
  @IsUUID()
  memberId: string;

  @IsNumber()
  amount: number;
}

export class ExpenseCategoryAmountDto {
  @IsUUID()
  categoryId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  items?: string;
}

export class CreateExpenseDto {
  @IsUUID()
  groupId: string;

  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseCategoryAmountDto)
  categoryAmounts: ExpenseCategoryAmountDto[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUri?: string;

  @IsDateString()
  @IsOptional()
  date?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpensePaymentDto)
  payments: ExpensePaymentDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitDto)
  splits: ExpenseSplitDto[];
}
