import { IsEmail, Matches } from "class-validator";

export class LoginWithEmailDto {
  @IsEmail()
  email: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
  password: string;
}
