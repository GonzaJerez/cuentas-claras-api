export class AiExpenseTemplateDto {
  title: string;
  date: string;
  description: string;
  categoryAmounts: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
  }>;
  payments: Array<{
    memberId: string;
    amount: number;
    memberName: string;
  }>;
  splits: Array<{
    memberId: string;
    amount: number;
    memberName: string;
  }>;
}
