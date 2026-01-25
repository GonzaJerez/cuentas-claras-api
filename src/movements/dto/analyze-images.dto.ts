import { IsUUID } from "class-validator";

export class AnalyzeImagesDto {
  @IsUUID()
  groupId: string;
}
