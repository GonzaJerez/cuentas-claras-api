export class RawAiExpenseData {
  title: string;
  date?: string;
  description?: string;
  detectedCategoryAmounts?: Array<{
    categoryName: string;
    amount: number;
    items?: string;
  }>;
  detectedPayments?: Array<{ memberName: string; amount?: number }>;
  detectedSplits?: Array<{ memberName: string; amount?: number }>;
}
