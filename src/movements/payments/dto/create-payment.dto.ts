import { IsUUID, IsNumber, IsOptional } from "class-validator";

export class CreatePaymentDto {
  @IsUUID()
  memberId: string;

  @IsUUID()
  @IsOptional()
  movementId: string;

  @IsNumber()
  amount: number;
}
