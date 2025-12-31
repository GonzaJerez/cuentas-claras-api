import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { LoginWithEmailDto } from "../dto/login-with-email.dto";
import { LoginAnonymousDto } from "../dto/login-anonymous";
import { LoginWithGoogleDto } from "../dto/login-with-google";
import { CreateUserWithMailDto } from "../dto/create-user-with-mail.dto";
import { GetUser } from "../decorators/get-user.decorator";
import { UserEntity } from "src/users/entities/user.entity";
import { ValidateSecurityCodeDto } from "../dto/validate-security-code.dto";
import { RecoverPasswordDto } from "../dto/recover-password.dto";
import { Auth } from "../decorators/auth.decorator";
import { LogoutDto } from "../dto/logout.dto";
import { StandardResponse } from "src/shared/dto/responses.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/login/anonymous")
  loginAnonymous(@Body() loginDto: LoginAnonymousDto) {
    return StandardResponse.basic(
      "Anonymous login successful",
      this.authService.loginAnonymous(loginDto),
    );
  }

  @Post("/login/google")
  loginGoogle(@Body() loginDto: LoginWithGoogleDto) {
    return StandardResponse.basic(
      "Google login successful",
      this.authService.loginWithGoogle(loginDto),
    );
  }

  @Post("/login")
  loginEmail(@Body() loginDto: LoginWithEmailDto) {
    return StandardResponse.basic(
      "Email login successful",
      this.authService.loginWithEmail(loginDto),
    );
  }

  @Post("/register")
  register(@Body() registerDto: CreateUserWithMailDto) {
    return StandardResponse.basic(
      "User registered successfully",
      this.authService.register(registerDto),
    );
  }

  @Post("/logout")
  @Auth()
  logout(@Body() logoutDto: LogoutDto, @GetUser() user: UserEntity) {
    return StandardResponse.basic(
      "User logged out successfully",
      this.authService.logout(logoutDto, user),
    );
  }

  // @Post("/sync-anonymous-email")
  // @Auth({ states: [UserState.EMAIL_CONFIRMATION_PENDING, UserState.ACTIVE] })
  // syncUserEmail(
  //   @Body() syncUserEmailDto: UpdateEmailDto,
  //   @GetUser() user: UserEntity,
  // ) {
  //   return StandardResponse.basic(
  //     "User sync with email successfully",
  //     this.authService.addAuthenticationWithEmailToAnonymousUser(
  //       syncUserEmailDto,
  //       user,
  //     ),
  //   );
  // }

  @Post("/recover-password")
  recoverPassword(@Body() recoverPasswordDto: RecoverPasswordDto) {
    return StandardResponse.basic(
      "Password recovered successfully",
      this.authService.recoverPassword(recoverPasswordDto),
    );
  }

  @Post("/validate-security-code")
  validateSecurityCode(
    @Body() validateSecurityCodeDto: ValidateSecurityCodeDto,
  ) {
    return StandardResponse.basic(
      "Security code validated successfully",
      this.authService.validateSecurityCode(validateSecurityCodeDto),
    );
  }
}
