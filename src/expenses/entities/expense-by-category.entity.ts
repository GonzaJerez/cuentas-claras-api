import { ExpenseByCategory as PrismaExpenseByCategory } from "../../../prisma/generated/client";
import { CategoryEntity } from "src/categories/entities/category.entity";

export class ExpenseByCategoryEntity implements PrismaExpenseByCategory {
  id: string;
  expenseId: string;
  categoryId: string;
  amount: number;
  items: string | null;

  category?: CategoryEntity;
}
