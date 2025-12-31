import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "../../config/envs/env.config";
import { JwtPayloadDto } from "../dto/jwt-payload.dto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { DatabaseService } from "src/config/database/database.service";
import { SessionState } from "prisma/generated/enums";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly db: DatabaseService) {
    super({
      secretOrKey: env!.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayloadDto) {
    const { sessionId } = payload;

    const session = await this.db.session.findUnique({
      where: { id: sessionId, state: SessionState.ACTIVE },
      include: {
        user: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException("Invalid session");
    }

    return session.user;
  }
}
