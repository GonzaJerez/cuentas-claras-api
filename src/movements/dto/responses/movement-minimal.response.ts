import { CategoryResponse } from "src/categories/dto/responses/category.response";
import { MovementEntity } from "src/movements/entities/movement.entity";
import { PaymentResponse } from "src/movements/payments/dto/payment.response";

export class MovementMinimalResponse {
  id: string;
  title: string;
  amount: number;
  date: Date;
  categories: CategoryResponse[];
  payments: PaymentResponse[];

  static fromEntity(entity: MovementEntity): MovementMinimalResponse {
    const totalAmount = entity.expenses?.reduce(
      (acc, expense) => acc + expense.amount,
      0,
    );

    const categories: CategoryResponse[] =
      entity.expenses
        ?.map((expense) => expense.category)
        .filter((category) => category !== undefined)
        .map(CategoryResponse.fromEntity) || [];

    return {
      id: entity.id,
      title: entity.title,
      amount: totalAmount ?? 0,
      date: entity.date,
      categories,
      payments: entity.payments?.map(PaymentResponse.fromEntity) || [],
    };
  }
}
