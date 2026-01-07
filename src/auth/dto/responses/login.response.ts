import { SimpleUserResponse } from "src/users/dto/responses/simple-user.response";

export class LoginResponseDto {
  token: string;
  user: SimpleUserResponse;
}
