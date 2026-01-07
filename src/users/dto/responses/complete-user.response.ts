import { UserRole, UserState } from "prisma/generated/enums";
import { UserEntity } from "src/users/entities/user.entity";

export class CompleteUserResponse {
  id: string;
  name: string;
  email: string | null;
  notifications: boolean;
  createdAt: Date;
  loginWithGoogle: boolean;
  anonymous: boolean;
  role: UserRole;
  state: UserState;

  static fromUserEntity(user: UserEntity): CompleteUserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      notifications: user.notifications,
      createdAt: user.createdAt,
      loginWithGoogle: user.loginWithGoogle,
      anonymous: user.anonymous,
      role: user.role,
      state: user.state,
    };
  }
}
