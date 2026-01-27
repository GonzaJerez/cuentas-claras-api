import { CategoryResponse } from "src/categories/dto/responses/category.response";
import { MovementEntity } from "src/movements/entities/movement.entity";
import { AmountByCategoryResponse } from "src/movements/amounts-by-categories/dto/responses/amount-by-category.response";
import { PaymentResponse } from "src/movements/payments/dto/payment.response";
import { SplitResponse } from "src/movements/splits/dto/split.response";

export class MovementDetailResponse {
  id: string;
  title: string;
  amount: number;
  date: Date;
  categories: CategoryResponse[];
  payments: PaymentResponse[];
  splits: SplitResponse[];
  amountsByCategories: AmountByCategoryResponse[];

  static fromEntity(entity: MovementEntity): MovementDetailResponse {
    const totalAmount = entity.amountsByCategories?.reduce(
      (acc, amountByCategory) => acc + amountByCategory.amount,
      0,
    );

    const categories: CategoryResponse[] =
      entity.amountsByCategories
        ?.map((amountByCategory) => amountByCategory.category)
        .filter((category) => category !== undefined)
        .map(CategoryResponse.fromEntity) || [];

    return {
      id: entity.id,
      title: entity.title,
      amount: totalAmount ?? 0,
      date: entity.date,
      categories,
      payments: entity.payments?.map(PaymentResponse.fromEntity) || [],
      splits: entity.splits?.map(SplitResponse.fromEntity) || [],
      amountsByCategories:
        entity.amountsByCategories?.map(AmountByCategoryResponse.fromEntity) ||
        [],
    };
  }
}
