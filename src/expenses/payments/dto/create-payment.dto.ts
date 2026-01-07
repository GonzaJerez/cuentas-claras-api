import { IsUUID, IsNumber, IsOptional } from "class-validator";

export class CreatePaymentDto {
  @IsUUID()
  memberId: string;

  @IsUUID()
  @IsOptional()
  expenseId?: string;

  @IsNumber()
  amount: number;
}
