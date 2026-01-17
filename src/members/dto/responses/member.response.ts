import { MemberRole, MemberState } from "prisma/generated/enums";
import { MemberEntity } from "src/members/entities/member.entity";

export class MemberResponse {
  id: string;
  name: string;
  email: string | null;
  role: MemberRole[];
  defaultSplit: number | null;
  initials: string;
  state: MemberState;

  static fromEntity(entity: MemberEntity): MemberResponse {
    return {
      id: entity.id,
      name: entity.user.name!,
      email: entity.user.email,
      role: entity.role,
      defaultSplit: entity.defaultSplit,
      initials: entity.user.initials!,
      state: entity.state,
    };
  }
}
