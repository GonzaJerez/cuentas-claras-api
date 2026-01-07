import { CategoryResponse } from "src/categories/dto/responses/category.response";
import { ExpenseEntity } from "src/expenses/entities/expense.entity";

export class ExpenseListResponse {
  id: string;
  title: string;
  amount: number;
  date: Date;
  categories: CategoryResponse[];

  static fromEntity(entity: ExpenseEntity): ExpenseListResponse {
    const totalAmount = entity.byCategory?.reduce(
      (acc, expense) => acc + expense.amount,
      0,
    );
    const categories: CategoryResponse[] =
      entity.byCategory
        ?.map((byCat) => byCat.category)
        .filter((category) => category !== undefined)
        .map(CategoryResponse.fromEntity) || [];

    return {
      id: entity.id,
      title: entity.title,
      amount: totalAmount ?? 0,
      date: entity.date,
      categories,
    };
  }
}
