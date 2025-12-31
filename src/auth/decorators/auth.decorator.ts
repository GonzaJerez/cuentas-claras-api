import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RoleGuard } from "../guards/role.guard";
import { UserRole, UserState } from "../../../prisma/generated/client";
import { StateGuard } from "../guards/state.guard";

type AuthProps = {
  roles?: UserRole[];
  states?: UserState[];
};

export function Auth({ roles, states }: AuthProps = {}) {
  return applyDecorators(
    SetMetadata("roles", roles),
    SetMetadata("states", states),
    UseGuards(AuthGuard("jwt"), RoleGuard, StateGuard),
  );
}
