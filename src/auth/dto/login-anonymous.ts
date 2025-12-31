import { IsString } from "class-validator";
import { CreateSessionDto } from "./create-session.dto";

export class LoginAnonymousDto extends CreateSessionDto {
  @IsString()
  name: string;
}
