import { SplitResponse } from "src/movements/splits/dto/split.response";
import { ExpenseResponse } from "../../expenses/dto/responses/expense.response";
import { MovementEntity } from "src/movements/entities/movement.entity";
import { PaymentResponse } from "src/movements/payments/dto/payment.response";

export class MovementResponse {
  id: string;
  title: string;
  date: Date;
  expenses: ExpenseResponse[];
  splits: SplitResponse[];
  payments: PaymentResponse[];

  static fromEntity(entity: MovementEntity): MovementResponse {
    return {
      id: entity.id,
      title: entity.title,
      date: entity.date,
      expenses: entity.expenses
        ? entity.expenses.map(ExpenseResponse.fromEntity)
        : [],
      splits: entity.splits?.map(SplitResponse.fromEntity) || [],
      payments: entity.payments?.map(PaymentResponse.fromEntity) || [],
    };
  }
}
