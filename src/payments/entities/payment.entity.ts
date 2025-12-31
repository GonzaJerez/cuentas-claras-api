import { Payment } from "../../../prisma/generated/client";

export class PaymentEntity implements Payment {
  id: string;
  memberId: string;
  expenseId: string | null;
  amount: number;
}
