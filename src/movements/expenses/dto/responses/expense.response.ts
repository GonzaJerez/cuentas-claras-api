import { CategoryResponse } from "src/categories/dto/responses/category.response";
import { ExpenseEntity } from "../../entities/expense.entity";

export class ExpenseResponse {
  id: string;
  category: CategoryResponse;
  amount: number;
  description: string | null;

  static fromEntity(entity: ExpenseEntity): ExpenseResponse {
    return {
      id: entity.id,
      category: CategoryResponse.fromEntity(entity.category!),
      amount: entity.amount,
      description: entity.description,
    };
  }
}
