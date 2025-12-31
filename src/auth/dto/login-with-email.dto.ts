import { IsEmail, Matches } from "class-validator";
import { CreateSessionDto } from "./create-session.dto";

export class LoginWithEmailDto extends CreateSessionDto {
  @IsEmail()
  email: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
  password: string;
}
