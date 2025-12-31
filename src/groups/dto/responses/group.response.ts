import { SplitType } from "@prisma/client";
import { GroupEntity } from "src/groups/entities/group.entity";
import { MemberResponse } from "src/members/dto/responses/member.response";
import { MemberEntity } from "src/members/entities/member.entity";
import { BasicUserResponse } from "src/users/dto/responses/basic-user.response";

export class GroupResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  splitType: SplitType;
  members: MemberResponse[];

  static toResponse(
    group: {
      members: ({
        user: BasicUserResponse;
      } & MemberEntity)[];
    } & GroupEntity,
  ): GroupResponse {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
      splitType: group.splitType,
      members: group.members.map(MemberResponse.fromEntity),
    };
  }
}
