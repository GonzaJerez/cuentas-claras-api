import { Expense } from "../../../prisma/generated/client";

export class ExpenseEntity implements Expense {
  id: string;
  categoryId: string;
  groupId: string;
  title: string;
  amount: number;
  description: string | null;
  imageUri: string | null;
  createdAt: Date;
  date: Date;
}
