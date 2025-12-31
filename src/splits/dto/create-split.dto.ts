import { IsUUID, IsNumber } from "class-validator";

export class CreateSplitDto {
  @IsUUID()
  memberId: string;

  @IsUUID()
  expenseId: string;

  @IsNumber()
  amount: number;
}
