import { IsString } from "class-validator";
import { CreateSessionDto } from "./create-session.dto";

export class LoginWithGoogleDto extends CreateSessionDto {
  @IsString()
  accessToken: string;
}
