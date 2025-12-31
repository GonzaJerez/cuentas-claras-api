import { BasicUserResponse } from "src/users/dto/responses/basic-user.response";

export class LoginResponseDto {
  token: string;
  user: BasicUserResponse;
}
