import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";
import { User, UserRole } from "prisma/generated/client";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles = this.reflector.get("roles", context.getHandler());

    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (!validRoles || validRoles.length === 0) {
      return user.role === UserRole.USER;
    }

    return validRoles.includes(user.role);
  }
}
