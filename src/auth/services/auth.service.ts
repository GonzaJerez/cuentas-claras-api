import { customAlphabet } from "nanoid";
import * as bcrypt from "bcryptjs";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPayloadDto } from "../dto/jwt-payload.dto";
import { LoginWithEmailDto } from "../dto/login-with-email.dto";
import { DatabaseService } from "src/config/database/database.service";
import { LoginAnonymousDto } from "../dto/login-anonymous";
import { LoginWithGoogleDto } from "../dto/login-with-google";
import { GoogleAccountResponse } from "../dto/google-account-response.dto";
import { CreateUserWithMailDto } from "../dto/create-user-with-mail.dto";
import { LogoutDto } from "../dto/logout.dto";
import { SessionState, UserState } from "prisma/generated/enums";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UserEntity } from "src/users/entities/user.entity";
import { ValidateSecurityCodeDto } from "../dto/validate-security-code.dto";
import { RecoverPasswordDto } from "../dto/recover-password.dto";
import { ResendSecurityCodeDto } from "../dto/resend-verification-code.dto";
import { SimpleUserResponse } from "src/users/dto/responses/simple-user.response";
import { LoginResponseDto } from "../dto/responses/login.response";
import { DeviceHeadersDto } from "../dto/device-headers.dto";
import {
  SECURITY_CODE_EXPIRATION_TIME,
  SECURITY_CODE_WINDOW_BETWEEN_RESEND_TIME,
} from "../constants/security-code";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async loginAnonymous(
    loginDto: LoginAnonymousDto & DeviceHeadersDto,
  ): Promise<LoginResponseDto> {
    // If the device is already in use by a user, log out the existing session
    const existingSession = await this.db.session.findFirst({
      where: {
        deviceId: loginDto.deviceId,
        state: SessionState.ACTIVE,
      },
    });

    if (existingSession) {
      await this.db.session.update({
        where: { id: existingSession.id },
        data: {
          state: SessionState.LOGGED_OUT,
          loggedOutAt: new Date(),
        },
      });
    }

    const user = await this.db.user.create({
      data: {
        anonymous: true,
      },
    });

    const session = await this.db.session.create({
      data: {
        deviceId: loginDto.deviceId,
        deviceType: loginDto.deviceType,
        userId: user.id,
      },
    });

    return {
      token: this.generateToken({
        sessionId: session.id,
      }),
      user: SimpleUserResponse.fromUserEntity(user),
    };
  }

  async loginWithEmail(
    loginDto: LoginWithEmailDto & DeviceHeadersDto,
  ): Promise<LoginResponseDto> {
    const user = await this.db.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.state === UserState.EMAIL_CONFIRMATION_PENDING) {
      throw new ForbiddenException("User email confirmation is not completed");
    }

    if (!user.password) {
      throw new BadRequestException(
        "User is not registered with email and password",
      );
    }

    const isPasswordCorrect = bcrypt.compareSync(
      loginDto.password,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedException("Invalid password");
    }

    // If the device is already in use by an anonymous user, log out the existing session
    const existingSession = await this.db.session.findFirst({
      where: {
        deviceId: loginDto.deviceId,
        state: SessionState.ACTIVE,
      },
    });
    if (existingSession) {
      await this.db.session.update({
        where: { id: existingSession.id },
        data: {
          state: SessionState.LOGGED_OUT,
          loggedOutAt: new Date(),
        },
      });
    }

    // Create a new session for the user
    const session = await this.db.session.create({
      data: {
        deviceId: loginDto.deviceId,
        deviceType: loginDto.deviceType,
        userId: user.id,
      },
    });

    return {
      token: this.generateToken({
        sessionId: session.id,
      }),
      user: SimpleUserResponse.fromUserEntity(user),
    };
  }

  async loginWithGoogle(
    loginDto: LoginWithGoogleDto & DeviceHeadersDto,
  ): Promise<LoginResponseDto> {
    const googleResponse = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" +
        loginDto.accessToken,
    );
    const userFromGoogle: GoogleAccountResponse = await googleResponse.json();

    const user = await this.db.user.findUnique({
      where: { email: userFromGoogle.email },
    });

    if (user && !user.loginWithGoogle) {
      throw new BadRequestException("User is not registered with google");
    }
    if (user && user.loginWithGoogle) {
      // If the device is already in use by an anonymous user, log out the existing session
      const existingAnonymousSession = await this.db.session.findFirst({
        where: {
          deviceId: loginDto.deviceId,
          state: SessionState.ACTIVE,
          user: { anonymous: true },
        },
      });
      if (existingAnonymousSession) {
        await this.db.session.update({
          where: { id: existingAnonymousSession.id },
          data: {
            state: SessionState.LOGGED_OUT,
            loggedOutAt: new Date(),
          },
        });
      }

      // Create a new session for the user
      const session = await this.db.session.create({
        data: {
          deviceId: loginDto.deviceId,
          deviceType: loginDto.deviceType,
          userId: user.id,
        },
      });

      return {
        token: this.generateToken({
          sessionId: session.id,
        }),
        user: SimpleUserResponse.fromUserEntity(user),
      };
    }

    // If not exist user with this email, check if there is an anonymous user
    const existingAnonymousSession = await this.db.session.findFirst({
      where: {
        deviceId: loginDto.deviceId,
        state: SessionState.ACTIVE,
        user: { anonymous: true },
      },
    });

    // If the user is already logged in anonymously, update the user with the google information and return the token for the existing session
    if (existingAnonymousSession) {
      const updatedUser = await this.db.user.update({
        where: { id: existingAnonymousSession.userId },
        data: {
          anonymous: false,
          loginWithGoogle: true,
          name: userFromGoogle.name,
          initials: this.getInitials(userFromGoogle.name),
          email: userFromGoogle.email,
        },
      });

      return {
        token: this.generateToken({
          sessionId: existingAnonymousSession.id,
        }),
        user: SimpleUserResponse.fromUserEntity(updatedUser),
      };
    }

    // If not exist an anonymous user, create a new user and session for the user
    const newUser = await this.db.user.create({
      data: {
        email: userFromGoogle.email,
        name: userFromGoogle.name,
        initials: this.getInitials(userFromGoogle.name),
        loginWithGoogle: true,
      },
    });
    const session = await this.db.session.create({
      data: {
        deviceId: loginDto.deviceId,
        deviceType: loginDto.deviceType,
        userId: newUser.id,
      },
    });

    return {
      token: this.generateToken({
        sessionId: session.id,
      }),
      user: SimpleUserResponse.fromUserEntity(newUser),
    };
  }

  async register(
    registerDto: CreateUserWithMailDto,
  ): Promise<SimpleUserResponse> {
    const user = await this.db.user.findUnique({
      where: { email: registerDto.email },
    });

    if (user) {
      throw new BadRequestException("User already exists");
    }

    const { securityCode, hashedSecurityCode } = this.generateSecurityCode();

    const initials = this.getInitials(registerDto.name);
    const newUser = await this.db.user.create({
      data: {
        name: registerDto.name,
        initials,
        email: registerDto.email,
        password: bcrypt.hashSync(registerDto.password, 10),
        securityCode: hashedSecurityCode,
        securityCodeCreatedAt: new Date(),
        state: UserState.EMAIL_CONFIRMATION_PENDING,
      },
    });

    this.eventEmitter.emit("auth.confirmation-email", {
      email: newUser.email,
      name: newUser.name,
      securityCode,
    });

    // Return only the user without the token authentication
    return SimpleUserResponse.fromUserEntity(newUser);
  }

  async logout(logoutDto: LogoutDto, user: UserEntity): Promise<void> {
    await this.db.session.update({
      where: { id: user.currentSession?.id },
      data: { state: SessionState.LOGGED_OUT, loggedOutAt: new Date() },
    });

    return;
  }

  async recoverPassword(
    recoverPasswordDto: RecoverPasswordDto,
  ): Promise<SimpleUserResponse> {
    const user = await this.db.user.findUnique({
      where: { email: recoverPasswordDto.email },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const { securityCode, hashedSecurityCode } = this.generateSecurityCode();

    await this.db.user.update({
      where: { id: user.id },
      data: {
        securityCode: hashedSecurityCode,
        securityCodeCreatedAt: new Date(),
      },
    });

    this.eventEmitter.emit("auth.recover-password", {
      email: user.email,
      name: user.name,
      securityCode,
    });

    return SimpleUserResponse.fromUserEntity(user);
  }

  // this method is used on confirm user email and recover password flows
  async validateSecurityCode(
    validateSecurityCodeDto: ValidateSecurityCodeDto & DeviceHeadersDto,
  ): Promise<LoginResponseDto> {
    const user = await this.db.user.findUnique({
      where: { email: validateSecurityCodeDto.email },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (
      !user.securityCode ||
      !bcrypt.compareSync(validateSecurityCodeDto.code, user.securityCode)
    ) {
      throw new BadRequestException("Invalid security code");
    }

    if (
      user.securityCodeCreatedAt &&
      this.isSecurityCodeExpired(user.securityCodeCreatedAt)
    ) {
      await this.db.user.update({
        where: { id: user.id },
        data: {
          securityCode: null,
          securityCodeCreatedAt: null,
        },
      });
      throw new BadRequestException("Security code has expired");
    }

    let token: string | null = null;

    // if (
    //   validateSecurityCodeDto.deviceId &&
    //   validateSecurityCodeDto.deviceType
    // ) {
    const session = await this.db.session.create({
      data: {
        deviceId: validateSecurityCodeDto.deviceId,
        deviceType: validateSecurityCodeDto.deviceType,
        userId: user.id,
      },
    });

    token = this.generateToken({
      sessionId: session.id,
    });
    // }

    await this.db.user.update({
      where: { id: user.id },
      data: {
        state: UserState.ACTIVE,
        securityCode: null,
        securityCodeCreatedAt: null,
        anonymous: false,
      },
    });

    return {
      user: SimpleUserResponse.fromUserEntity(user),
      token,
    };
  }

  async resendVerificationCode(
    resendVerificationCodeDto: ResendSecurityCodeDto,
  ): Promise<SimpleUserResponse> {
    const user = await this.db.user.findUnique({
      where: { email: resendVerificationCodeDto.email },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (
      user.securityCodeCreatedAt &&
      !this.isSecurityCodeResendAllowed(user.securityCodeCreatedAt)
    ) {
      throw new BadRequestException(
        "You can only resend the verification code every 15 minutes",
      );
    }

    const { securityCode, hashedSecurityCode } = this.generateSecurityCode();

    await this.db.user.update({
      where: { id: user.id },
      data: {
        securityCode: hashedSecurityCode,
        securityCodeCreatedAt: new Date(),
      },
    });

    this.eventEmitter.emit("auth.confirmation-email", {
      email: user.email,
      name: user.name,
      securityCode,
    });

    return SimpleUserResponse.fromUserEntity(user);
  }

  async renewToken(
    user: UserEntity,
    deviceId: string,
  ): Promise<LoginResponseDto> {
    const session = await this.db.session.findFirst({
      where: {
        deviceId,
        userId: user.id,
        state: SessionState.ACTIVE,
      },
    });
    if (!session) {
      throw new NotFoundException("Session not found");
    }
    return {
      token: this.generateToken({
        sessionId: session.id,
      }),
      user: SimpleUserResponse.fromUserEntity(user),
    };
  }

  private generateToken(payload: JwtPayloadDto) {
    return this.jwtService.sign(payload);
  }

  generateSecurityCode() {
    const securityCode = customAlphabet("0123456789", 6)();
    const hashedSecurityCode = bcrypt.hashSync(securityCode, 10);

    return { securityCode, hashedSecurityCode };
  }

  getInitials(name: string) {
    if (!name || typeof name !== "string") return "";
    const trimmed = name.trim();
    if (!trimmed) return "";
    const words = trimmed.split(" ");
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    } else {
      return words
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join("");
    }
  }

  private isSecurityCodeExpired(securityCodeCreatedAt: Date) {
    const expirationTime =
      securityCodeCreatedAt.getTime() + SECURITY_CODE_EXPIRATION_TIME;
    return expirationTime < Date.now();
  }

  private isSecurityCodeResendAllowed(securityCodeCreatedAt: Date) {
    const resendAllowedTime =
      securityCodeCreatedAt.getTime() +
      SECURITY_CODE_WINDOW_BETWEEN_RESEND_TIME;

    return resendAllowedTime < Date.now();
  }
}
