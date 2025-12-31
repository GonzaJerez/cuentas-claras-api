import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ConfirmationEmailDto } from "./dto/confirmation-email.dto";
import { env } from "src/config/envs/env.config";
import { RecoverPasswordDto } from "./dto/recover-password.dto";

@Injectable()
export class EmailsService {
  constructor(private readonly mailerService: MailerService) {}

  @OnEvent("auth.confirmation-email")
  async sendConfirmationEmail({
    email,
    name,
    securityCode,
  }: ConfirmationEmailDto) {
    const confirmationUrl = `${env!.MOBILE_APP_URL}/confirm-email?code=${securityCode}&email=${encodeURIComponent(email)}`;

    await this.mailerService.sendMail({
      to: email,
      subject: "Confirmación de email",
      template: "confirmation-email",
      context: { name, securityCode, confirmationUrl },
    });
  }

  @OnEvent("auth.recover-password")
  async sendRecoverPasswordEmail({
    email,
    name,
    securityCode,
  }: RecoverPasswordDto) {
    const recoverPasswordUrl = `${env!.MOBILE_APP_URL}/recover-password?code=${securityCode}&email=${encodeURIComponent(email)}`;
    console.log({ recoverPasswordUrl });

    await this.mailerService.sendMail({
      to: email,
      subject: "Recuperación de contraseña",
      template: "recover-password",
      context: { name, url: recoverPasswordUrl },
    });
  }
}
