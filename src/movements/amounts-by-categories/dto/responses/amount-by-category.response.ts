import { CategoryResponse } from "src/categories/dto/responses/category.response";
import { AmountByCategoryEntity } from "../../entities/amount-by-category.entity";

export class AmountByCategoryResponse {
  id: string;
  category: CategoryResponse;
  amount: number;
  description: string | null;

  static fromEntity(entity: AmountByCategoryEntity): AmountByCategoryResponse {
    return {
      id: entity.id,
      category: CategoryResponse.fromEntity(entity.category),
      amount: entity.amount,
      description: entity.description,
    };
  }
}
