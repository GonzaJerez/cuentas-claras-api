import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsArray,
} from "class-validator";
import { Type } from "class-transformer";
import { CreatePaymentDto } from "../payments/dto/create-payment.dto";
import { CreateAmountByCategoryDto } from "../amounts-by-categories/dto/create-amount-by-category.dto";
import { CreateSplitDto } from "../splits/dto/create-split.dto";

// export class CreatePaymentDto {
//   @IsUUID()
//   memberId: string;

//   @IsNumber()
//   amount: number;

//   @IsUUID()
//   @IsOptional()
//   receiverId?: string;

//   movementId: string;
// }

// export class CreateSplitDto {
//   @IsUUID()
//   memberId: string;

//   @IsNumber()
//   amount: number;
// }

// export class CreateAmountByCategoryDto {
//   @IsUUID()
//   categoryId: string;

//   @IsNumber()
//   amount: number;

//   @IsString()
//   @IsOptional()
//   description?: string;
// }

export class CreateMovementDto {
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
  @Type(() => CreateAmountByCategoryDto)
  amountsByCategories: CreateAmountByCategoryDto[];

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
