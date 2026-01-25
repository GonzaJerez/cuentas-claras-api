import { IsUUID, IsNumber } from "class-validator";

export class CreateSplitDto {
  @IsUUID()
  memberId: string;

  @IsUUID()
  movementId: string;

  @IsNumber()
  amount: number;
}
