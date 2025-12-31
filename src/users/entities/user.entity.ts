import { User, UserRole, UserState } from "../../../prisma/generated/client";

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
  securityCodeExpiresAt: Date | null;
  state: UserState;
}
