import { customAlphabet } from "nanoid";
import * as bcrypt from "bcryptjs";
import {
  BadRequestException,
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
import { BasicUserResponse } from "src/users/dto/responses/basic-user.response";
import { LoginResponseDto } from "../dto/responses/login.response";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async loginAnonymous(loginDto: LoginAnonymousDto): Promise<LoginResponseDto> {
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
        name: loginDto.name,
        initials: this.getInitials(loginDto.name),
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
      user: {
        email: user.email,
        name: user.name,
      },
    };
  }

  async loginWithEmail(loginDto: LoginWithEmailDto): Promise<LoginResponseDto> {
    const user = await this.db.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.state === UserState.EMAIL_CONFIRMATION_PENDING) {
      throw new BadRequestException("User email confirmation is not completed");
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
      user: {
        email: user.email,
        name: user.name,
      },
    };
  }

  async loginWithGoogle(
    loginDto: LoginWithGoogleDto,
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
        user: {
          email: user.email,
          name: user.name,
        },
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
      await this.db.user.update({
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
        user: {
          email: userFromGoogle.email,
          name: userFromGoogle.name,
        },
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
      user: {
        email: newUser.email,
        name: newUser.name,
      },
    };
  }

  async register(
    registerDto: CreateUserWithMailDto,
  ): Promise<BasicUserResponse> {
    const user = await this.db.user.findUnique({
      where: { email: registerDto.email },
    });

    if (user) {
      throw new BadRequestException("User already exists");
    }

    const { securityCode, securityCodeExpiration, hashedSecurityCode } =
      this.generateSecurityCode();

    const initials = this.getInitials(registerDto.name);
    const newUser = await this.db.user.create({
      data: {
        name: registerDto.name,
        initials,
        email: registerDto.email,
        password: bcrypt.hashSync(registerDto.password, 10),
        securityCode: hashedSecurityCode,
        securityCodeExpiresAt: securityCodeExpiration,
        state: UserState.EMAIL_CONFIRMATION_PENDING,
      },
    });

    this.eventEmitter.emit("auth.confirmation-email", {
      email: newUser.email,
      name: newUser.name,
      securityCode,
    });

    // Return only the user without the token authentication
    return {
      email: newUser.email,
      name: newUser.name,
    };
  }

  async logout(logoutDto: LogoutDto, user: UserEntity): Promise<void> {
    const session = await this.db.session.findUnique({
      where: {
        id: logoutDto.sessionId,
        state: SessionState.ACTIVE,
        userId: user.id,
      },
    });
    if (!session) {
      throw new NotFoundException("Session not found");
    }
    await this.db.session.update({
      where: { id: logoutDto.sessionId },
      data: { state: SessionState.LOGGED_OUT, loggedOutAt: new Date() },
    });

    return;
  }

  // async addAuthenticationWithEmailToAnonymousUser(
  //   syncUserEmailDto: UpdateEmailDto,
  //   user: UserEntity,
  // ): Promise<BasicUserResponse> {
  //   if (user.state !== UserState.EMAIL_CONFIRMATION_PENDING) {
  //     throw new BadRequestException("You are not allowed to sync your email");
  //   }

  //   const existingUserWithEmail = await this.db.user.findUnique({
  //     where: { email: syncUserEmailDto.email },
  //   });

  //   if (existingUserWithEmail) {
  //     throw new BadRequestException("User with this email already exists");
  //   }

  //   const { securityCode, securityCodeExpiration, hashedSecurityCode } =
  //     this.generateSecurityCode();

  //   const updatedUser = await this.db.user.update({
  //     where: { id: user.id },
  //     data: {
  //       email: syncUserEmailDto.email,
  //       password: bcrypt.hashSync(syncUserEmailDto.password, 10),
  //       securityCode: hashedSecurityCode,
  //       securityCodeExpiresAt: securityCodeExpiration,
  //       anonymous: false,
  //       state: UserState.EMAIL_CONFIRMATION_PENDING,
  //     },
  //   });

  //   this.eventEmitter.emit("auth.confirmation-email", {
  //     email: syncUserEmailDto.email,
  //     name: user.name,
  //     securityCode,
  //   });

  //   return {
  //     email: updatedUser.email,
  //     name: updatedUser.name,
  //   };
  // }

  async recoverPassword(
    recoverPasswordDto: RecoverPasswordDto,
  ): Promise<BasicUserResponse> {
    const user = await this.db.user.findUnique({
      where: { email: recoverPasswordDto.email },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const { securityCode, securityCodeExpiration, hashedSecurityCode } =
      this.generateSecurityCode();

    await this.db.user.update({
      where: { id: user.id },
      data: {
        securityCode: hashedSecurityCode,
        securityCodeExpiresAt: securityCodeExpiration,
      },
    });

    this.eventEmitter.emit("auth.recover-password", {
      email: user.email,
      name: user.name,
      securityCode,
    });

    return {
      email: user.email,
      name: user.name,
    };
  }

  // this method is used on confirm user email and recover password flows
  async validateSecurityCode(
    validateSecurityCodeDto: ValidateSecurityCodeDto,
  ): Promise<{ user: BasicUserResponse; token: string | null }> {
    const user = await this.db.user.findUnique({
      where: { email: validateSecurityCodeDto.email },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (
      !user.securityCode ||
      !bcrypt.compareSync(
        validateSecurityCodeDto.securityCode,
        user.securityCode,
      )
    ) {
      throw new BadRequestException("Invalid security code");
    }

    if (user.securityCodeExpiresAt && user.securityCodeExpiresAt < new Date()) {
      throw new BadRequestException("Security code has expired");
    }

    let token: string | null = null;

    if (
      validateSecurityCodeDto.deviceId &&
      validateSecurityCodeDto.deviceType
    ) {
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
    }

    await this.db.user.update({
      where: { id: user.id },
      data: {
        state: UserState.ACTIVE,
        securityCode: null,
        securityCodeExpiresAt: null,
        anonymous: false,
      },
    });

    return {
      user: {
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  private generateToken(payload: JwtPayloadDto) {
    return this.jwtService.sign(payload);
  }

  generateSecurityCode(expiresIn: number = 15) {
    const securityCode = customAlphabet("0123456789", 6)();
    const securityCodeExpiration = new Date(Date.now() + 1000 * 60 * expiresIn);
    const hashedSecurityCode = bcrypt.hashSync(securityCode, 10);

    return { securityCode, securityCodeExpiration, hashedSecurityCode };
  }

  private getInitials(name: string) {
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
}
