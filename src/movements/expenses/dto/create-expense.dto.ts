export class CreateExpenseDto {
  categoryId: string;
  amount: number;
  description?: string;
  movementId: string;
}
