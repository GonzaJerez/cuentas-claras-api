import { MemberRole } from "prisma/generated/enums";
import { MemberEntity } from "src/members/entities/member.entity";
import { BasicUserResponse } from "src/users/dto/responses/basic-user.response";

export class MemberResponse {
  id: string;
  name: string;
  email: string | null;
  role: MemberRole[];
  defaultSplit: number | null;

  static fromEntity(
    entity: {
      user: BasicUserResponse;
    } & MemberEntity,
  ): MemberResponse {
    return {
      id: entity.id,
      name: entity.user.name,
      email: entity.user.email,
      role: entity.role,
      defaultSplit: entity.defaultSplit,
    };
  }
}
