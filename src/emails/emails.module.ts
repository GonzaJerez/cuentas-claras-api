import { join } from "path";
import { Module } from "@nestjs/common";
import { EmailsService } from "./emails.service";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { env } from "../config/envs/env.config";

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: env!.EMAIL_USER,
          pass: env!.EMAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"Cuentas Claras" <${env!.EMAIL_USER}>`,
      },
      template: {
        dir: join(__dirname, "./templates"),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [EmailsService],
})
export class EmailsModule {}
