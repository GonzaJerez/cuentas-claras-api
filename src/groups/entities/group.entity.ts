import { MemberEntity } from "src/members/entities/member.entity";
import { Group, SplitType } from "../../../prisma/generated/client";

export class GroupEntity implements Group {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  splitType: SplitType;

  members?: MemberEntity[];
}
