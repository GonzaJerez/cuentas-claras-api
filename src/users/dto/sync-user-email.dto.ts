import { IsEmail, IsOptional, Matches } from "class-validator";

export class UpdateEmailDto {
  @IsEmail()
  email: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
  @IsOptional()
  password?: string;
}
