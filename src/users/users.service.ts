import * as bcrypt from "bcryptjs";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UpdateUserDto } from "./dto/update-user.dto";
import { DatabaseService } from "../config/database/database.service";
import { UserRole, UserState } from "prisma/generated/enums";
import { UserEntity } from "./entities/user.entity";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import { SimpleUserResponse } from "./dto/responses/simple-user.response";
import { UpdateEmailDto } from "./dto/sync-user-email.dto";
import { AuthService } from "src/auth/services/auth.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CompleteUserResponse } from "./dto/responses/complete-user.response";

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly authService: AuthService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findOne(id: string, user: UserEntity): Promise<CompleteUserResponse> {
    if (id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("You are not allowed to access this user");
    }

    const userFound = await this.db.user.findUnique({
      where: { id },
    });
    if (!userFound) {
      throw new NotFoundException("User not found");
    }
    return CompleteUserResponse.fromUserEntity(userFound);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    user: UserEntity,
  ): Promise<SimpleUserResponse> {
    if (user.id !== id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("You are not allowed to update this user");
    }
    const updatedUser = await this.db.user.update({
      where: { id },
      data: updateUserDto,
    });

    return SimpleUserResponse.fromUserEntity(updatedUser);
  }

  async updatePassword(
    updatePasswordDto: UpdatePasswordDto,
    user: UserEntity,
  ): Promise<SimpleUserResponse> {
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

    return SimpleUserResponse.fromUserEntity(updatedUser);
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

    return SimpleUserResponse.fromUserEntity(updatedUser);
  }
}
