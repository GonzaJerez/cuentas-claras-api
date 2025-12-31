import { PartialType } from "@nestjs/mapped-types";
import { CreateSessionDto } from "./create-session.dto";
import { IsEmail, IsString, Length } from "class-validator";

export class ValidateSecurityCodeDto extends PartialType(CreateSessionDto) {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  securityCode: string;
}
