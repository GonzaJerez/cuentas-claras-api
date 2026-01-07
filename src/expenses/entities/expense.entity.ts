import { MemberEntity } from "src/members/entities/member.entity";
import { SplitEntity } from "../splits/entities/split.entity";
import { PaymentEntity } from "../payments/entities/payment.entity";
import { ExpenseByCategoryEntity } from "./expense-category.entity";

export class ExpenseEntity {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  imageUri: string | null;
  createdAt: Date;
  date: Date;
  createdById: string;

  createdBy?: MemberEntity;
  byCategory?: ExpenseByCategoryEntity[];
  splits?: SplitEntity[];
  payments: PaymentEntity[];
}
