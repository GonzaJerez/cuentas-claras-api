import { Body, Controller, Get, Headers, HttpCode, Post } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { LoginWithEmailDto } from "../dto/login-with-email.dto";
import { LoginAnonymousDto } from "../dto/login-anonymous";
import { LoginWithGoogleDto } from "../dto/login-with-google";
import { CreateUserWithMailDto } from "../dto/create-user-with-mail.dto";
import { GetUser } from "../decorators/get-user.decorator";
import { UserEntity } from "src/users/entities/user.entity";
import { ValidateSecurityCodeDto } from "../dto/validate-security-code.dto";
import { RecoverPasswordDto } from "../dto/recover-password.dto";
import { ResendSecurityCodeDto } from "../dto/resend-verification-code.dto";
import { Auth } from "../decorators/auth.decorator";
import { LogoutDto } from "../dto/logout.dto";
import { StandardResponse } from "src/shared/dto/responses.dto";
import { DEVICE_ID_HEADER } from "../constants/headers";
import { DeviceHeadersDto } from "../dto/device-headers.dto";
import { GetDeviceHeaders } from "../decorators/get-device-headers.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("/renew-token")
  renewToken(
    @GetUser() user: UserEntity,
    @Headers(DEVICE_ID_HEADER) deviceId: string,
  ) {
    return StandardResponse.basic(
      "Token renewed successfully",
      this.authService.renewToken(user, deviceId),
    );
  }

  @Post("/login/anonymous")
  loginAnonymous(
    @Body() loginDto: LoginAnonymousDto,
    @GetDeviceHeaders() deviceHeaders: DeviceHeadersDto,
  ) {
    return StandardResponse.basic(
      "Anonymous login successful",
      this.authService.loginAnonymous({ ...loginDto, ...deviceHeaders }),
    );
  }

  @Post("/login/google")
  loginGoogle(
    @Body() loginDto: LoginWithGoogleDto,
    @GetDeviceHeaders() deviceHeaders: DeviceHeadersDto,
  ) {
    return StandardResponse.basic(
      "Google login successful",
      this.authService.loginWithGoogle({ ...loginDto, ...deviceHeaders }),
    );
  }

  @Post("/login")
  loginEmail(
    @Body() loginDto: LoginWithEmailDto,
    @GetDeviceHeaders() deviceHeaders: DeviceHeadersDto,
  ) {
    return StandardResponse.basic(
      "Email login successful",
      this.authService.loginWithEmail({ ...loginDto, ...deviceHeaders }),
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

  @Post("/recover-password")
  recoverPassword(@Body() recoverPasswordDto: RecoverPasswordDto) {
    return StandardResponse.basic(
      "Password recovered successfully",
      this.authService.recoverPassword(recoverPasswordDto),
    );
  }

  @Post("/resend-security-code")
  resendSecurityCode(@Body() resendSecurityCodeDto: ResendSecurityCodeDto) {
    return StandardResponse.basic(
      "Security code resent successfully",
      this.authService.resendVerificationCode(resendSecurityCodeDto),
    );
  }

  @Post("/validate-security-code")
  @HttpCode(200)
  validateSecurityCode(
    @Body() validateSecurityCodeDto: ValidateSecurityCodeDto,
    @GetDeviceHeaders() deviceHeaders: DeviceHeadersDto,
  ) {
    return StandardResponse.basic(
      "Security code validated successfully",
      this.authService.validateSecurityCode({
        ...validateSecurityCodeDto,
        ...deviceHeaders,
      }),
    );
  }
}
