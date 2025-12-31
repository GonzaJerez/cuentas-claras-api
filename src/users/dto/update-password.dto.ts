import { Matches, IsOptional } from "class-validator";

export class UpdatePasswordDto {
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
  @IsOptional()
  oldPassword?: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
  password: string;
}
