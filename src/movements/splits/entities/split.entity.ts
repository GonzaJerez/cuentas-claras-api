import { Split } from "prisma/generated/client";
import { MemberEntity } from "src/members/entities/member.entity";

export class SplitEntity implements Split {
  id: string;
  memberId: string;
  movementId: string;
  amount: number;

  member: MemberEntity;
}
