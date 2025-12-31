import { Split } from "../../../prisma/generated/client";

export class SplitEntity implements Split {
  id: string;
  memberId: string;
  expenseId: string;
  amount: number;
}
