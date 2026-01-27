import { IsUUID } from "class-validator";

export class AnalyzeAudioDto {
  @IsUUID()
  groupId: string;
}
