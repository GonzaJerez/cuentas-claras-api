import { SplitType } from "@prisma/client";

export class ListGroupResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  splitType: SplitType;
  membersCount: number;
}
