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

export class CreateExpenseDto {
  @IsUUID()
  categoryId: string;

  @IsUUID()
  groupId: string;

  @IsString()
  title: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUri?: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpensePaymentDto)
  payments: ExpensePaymentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitDto)
  splits: ExpenseSplitDto[];
}
