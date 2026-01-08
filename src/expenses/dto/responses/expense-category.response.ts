import { CategoryResponse } from "src/categories/dto/responses/category.response";
import { ExpenseByCategoryEntity } from "src/expenses/entities/expense-by-category.entity";

export class ExpenseCategoryResponse {
  id: string;
  category: CategoryResponse;
  amount: number;
  items: string | null;

  static fromEntity(entity: ExpenseByCategoryEntity): ExpenseCategoryResponse {
    return {
      id: entity.id,
      category: CategoryResponse.fromEntity(entity.category!),
      amount: entity.amount,
      items: entity.items,
    };
  }
}
