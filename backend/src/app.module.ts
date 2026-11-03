import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { HealthModule } from "./health";
import { MailModule } from "./mail/mail.module";
import { CreditsModule } from "./credits/credits.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ReadingsModule } from "./readings/readings.module";
import { HttpLoggerMiddleware } from "./common/middleware/http-logger.middleware";

@Module({
  imports: [
    // Reads backend/.env (the working directory when running pnpm scripts). On Render, variables come from the service settings.
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>("MONGODB_URI"),
        autoIndex: false,
      }),
    }),
    HealthModule,
    MailModule,
    CreditsModule,
    AuthModule,
    UsersModule,
    ReadingsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes("*");
  }
}
