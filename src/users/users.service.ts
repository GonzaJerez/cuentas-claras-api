import * as bcrypt from "bcryptjs";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { UpdateUserDto } from "./dto/update-user.dto";
import { DatabaseService } from "../config/database/database.service";
import { UserRole, UserState } from "prisma/generated/enums";
import { UserEntity } from "./entities/user.entity";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import { BasicUserResponse } from "./dto/responses/basic-user.response";
import { UpdateEmailDto } from "./dto/sync-user-email.dto";
import { AuthService } from "src/auth/services/auth.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly authService: AuthService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  update(id: string, updateUserDto: UpdateUserDto, user: UserEntity) {
    if (user.id !== id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("You are not allowed to update this user");
    }
    return this.db.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async updatePassword(
    updatePasswordDto: UpdatePasswordDto,
    user: UserEntity,
  ): Promise<BasicUserResponse> {
    if (user.anonymous || !user.email || !user.password) {
      throw new ForbiddenException(
        "You are not allowed to update your password",
      );
    }

    if (
      updatePasswordDto.oldPassword &&
      !bcrypt.compareSync(updatePasswordDto.oldPassword, user.password)
    ) {
      throw new ForbiddenException("Invalid old password");
    }

    const updatedUser = await this.db.user.update({
      where: { id: user.id },
      data: {
        password: bcrypt.hashSync(updatePasswordDto.password, 10),
      },
    });

    return {
      email: updatedUser.email,
      name: updatedUser.name,
    };
  }

  async updateEmail(updateEmailDto: UpdateEmailDto, user: UserEntity) {
    const existingUserWithEmail = await this.db.user.findUnique({
      where: { email: updateEmailDto.email },
    });

    if (existingUserWithEmail) {
      throw new BadRequestException("User with this email already exists");
    }

    const { securityCode, securityCodeExpiration, hashedSecurityCode } =
      this.authService.generateSecurityCode();

    if (!user.anonymous && updateEmailDto.password) {
      throw new BadRequestException(
        "password is not allowed. To update your password, please use the /password endpoint",
      );
    }

    if (user.anonymous && !updateEmailDto.password) {
      throw new BadRequestException("Password is required to update email");
    }

    const updatedUser = await this.db.user.update({
      where: { id: user.id },
      data: {
        email: updateEmailDto.email,
        password: updateEmailDto.password
          ? bcrypt.hashSync(updateEmailDto.password, 10)
          : undefined,
        securityCode: hashedSecurityCode,
        securityCodeExpiresAt: securityCodeExpiration,
        anonymous: false,
        state: UserState.EMAIL_CONFIRMATION_PENDING,
      },
    });

    this.eventEmitter.emit("auth.confirmation-email", {
      email: updateEmailDto.email,
      name: user.name,
      securityCode,
    });

    return {
      email: updatedUser.email,
      name: updatedUser.name,
    };
  }
}
