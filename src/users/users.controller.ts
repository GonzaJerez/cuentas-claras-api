import { Controller, Patch, Param, Body } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { UserEntity } from "./entities/user.entity";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import { BasicUserResponse } from "./dto/responses/basic-user.response";
import { StandardResponse } from "src/shared/dto/responses.dto";
import { UpdateEmailDto } from "./dto/sync-user-email.dto";
import { UserState } from "prisma/generated/enums";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch("/password")
  @Auth()
  updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<BasicUserResponse>> {
    return StandardResponse.basic(
      "Password updated successfully",
      this.usersService.updatePassword(updatePasswordDto, user),
    );
  }

  @Patch("/email")
  @Auth({ states: [UserState.EMAIL_CONFIRMATION_PENDING, UserState.ACTIVE] })
  updateEmail(
    @Body() updateEmailDto: UpdateEmailDto,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<BasicUserResponse>> {
    return StandardResponse.basic(
      "Email updated successfully, please check your email for the confirmation code",
      this.usersService.updateEmail(updateEmailDto, user),
    );
  }

  @Patch(":id")
  @Auth()
  update(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: UserEntity,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }
}
