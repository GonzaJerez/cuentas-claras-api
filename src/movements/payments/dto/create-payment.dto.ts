import { IsNumber, IsOptional, IsUUID } from "class-validator";

export class CreatePaymentDto {
  @IsUUID()
  memberId: string;

  @IsNumber()
  amount: number;

  @IsUUID()
  @IsOptional()
  receiverId?: string;
}
