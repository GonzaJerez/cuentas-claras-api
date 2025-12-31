import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  Matches,
} from "class-validator";

export class CreateUserWithMailDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
  password: string;

  @IsBoolean()
  @IsOptional()
  notifications?: boolean;
}
