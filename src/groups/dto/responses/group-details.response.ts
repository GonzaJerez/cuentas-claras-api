import { SplitType } from "@prisma/client";
import { ExpenseListResponse } from "src/expenses/dto/responses/expense-list.response";
import { MemberResponse } from "src/members/dto/responses/member.response";

export class GroupDetailsResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  splitType: SplitType;

  members: MemberResponse[];
  lastExpenses: ExpenseListResponse[];
  // categories: CategoryResponse[];
  balance: number;
}
