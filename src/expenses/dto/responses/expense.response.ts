import { ExpenseEntity } from "src/expenses/entities/expense.entity";
import { PaymentResponse } from "src/expenses/payments/dto/payment.response";
import { SplitResponse } from "src/expenses/splits/dto/split.response";
import { ExpenseCategoryResponse } from "./expense-category.response";

export class ExpenseResponse {
  id: string;
  title: string;
  date: Date;
  categoryAmounts: ExpenseCategoryResponse[];
  splits: SplitResponse[];
  payments: PaymentResponse[];

  static fromEntity(entity: ExpenseEntity): ExpenseResponse {
    return {
      id: entity.id,
      title: entity.title,
      date: entity.date,
      categoryAmounts: entity.byCategory
        ? entity.byCategory.map(ExpenseCategoryResponse.fromEntity)
        : [],
      splits: entity.splits?.map(SplitResponse.fromEntity) || [],
      payments: entity.payments.map(PaymentResponse.fromEntity),
    };
  }
}
