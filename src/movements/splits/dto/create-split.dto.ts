import { IsUUID, IsNumber } from "class-validator";

export class CreateSplitDto {
  @IsUUID()
  memberId: string;

  @IsNumber()
  amount: number;
}
