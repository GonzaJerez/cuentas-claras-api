import { IsEmail } from "class-validator";

export class ResendSecurityCodeDto {
  @IsEmail()
  email: string;
}
