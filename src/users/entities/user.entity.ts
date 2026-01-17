import {
  Session,
  User,
  UserRole,
  UserState,
} from "../../../prisma/generated/client";

export class UserEntity implements User {
  id: string;
  name: string;
  initials: string;
  createdAt: Date;
  email: string | null;
  notifications: boolean;
  password: string | null;
  loginWithGoogle: boolean;
  anonymous: boolean;
  role: UserRole;
  securityCode: string | null;
  securityCodeCreatedAt: Date | null;
  state: UserState;

  sessions?: Session[];
  currentSession?: Session;
}
