import { MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./config/database/database.module";
import { UsersModule } from "./users/users.module";
import { GroupsModule } from "./groups/groups.module";
import { MembersModule } from "./members/members.module";
import { CategoriesModule } from "./categories/categories.module";
import { AuthModule } from "./auth/auth.module";
import { EmailsModule } from "./emails/emails.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { LoggingMiddleware } from "./config/logger/logging.middleware";
import { MovementsModule } from "./movements/movements.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    GroupsModule,
    MembersModule,
    MovementsModule,
    CategoriesModule,
    AuthModule,
    EmailsModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes("*");
  }
}
