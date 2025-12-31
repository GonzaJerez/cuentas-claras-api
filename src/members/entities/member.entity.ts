import {
  Member,
  MemberRole,
  MemberState,
} from "../../../prisma/generated/client";

export class MemberEntity implements Member {
  id: string;
  userId: string;
  groupId: string;
  invitedById: string | null;
  role: MemberRole[];
  state: MemberState;
  code: string;
  createdAt: Date;
  notifications: boolean | null;
  defaultSplit: number | null;
  invitedBy: Member | null;
}
