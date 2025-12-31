import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";
import { User, UserState } from "prisma/generated/client";

@Injectable()
export class StateGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validStates = this.reflector.get("states", context.getHandler());

    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (!validStates || validStates.length === 0) {
      if (user.state === UserState.ACTIVE) {
        return true;
      } else {
        throw new ForbiddenException("User is not active");
      }
    }

    return validStates.includes(user.state);
  }
}
