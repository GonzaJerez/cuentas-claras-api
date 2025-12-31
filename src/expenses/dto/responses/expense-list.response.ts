import { CategoryResponse } from "src/categories/dto/responses/category.response";

export class ExpenseListResponse {
  id: string;
  title: string;
  amount: number;
  date: Date;
  category: CategoryResponse;
}
