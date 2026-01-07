import { Controller, Patch, Param, Body, Get } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { UserEntity } from "./entities/user.entity";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import { SimpleUserResponse } from "./dto/responses/simple-user.response";
import { StandardResponse } from "src/shared/dto/responses.dto";
import { UpdateEmailDto } from "./dto/sync-user-email.dto";
import { UserState } from "prisma/generated/enums";
import { CompleteUserResponse } from "./dto/responses/complete-user.response";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id")
  @Auth()
  get(
    @Param("id") id: string,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<CompleteUserResponse>> {
    return StandardResponse.basic(
      "User retrieved successfully",
      this.usersService.findOne(id, user),
    );
  }

  @Patch("/password")
  @Auth()
  updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<SimpleUserResponse>> {
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
  ): Promise<StandardResponse<SimpleUserResponse>> {
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
  ): Promise<StandardResponse<SimpleUserResponse>> {
    return StandardResponse.basic(
      "User updated successfully",
      this.usersService.update(id, updateUserDto, user),
    );
  }
}
