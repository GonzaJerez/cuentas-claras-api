import { UserRole, UserState } from "prisma/generated/enums";
import { UserEntity } from "src/users/entities/user.entity";

export class SimpleUserResponse {
  id: string;
  name: string | null;
  email: string | null;
  initials: string | null;
  role: UserRole;
  state: UserState;

  static fromUserEntity(user: UserEntity): SimpleUserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      initials: user.initials,
      role: user.role,
      state: user.state,
    };
  }
}
