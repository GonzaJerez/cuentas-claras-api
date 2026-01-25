import { IsUUID, IsString, IsNotEmpty } from "class-validator";

export class AnalyzeTextDto {
  @IsUUID()
  groupId: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}
