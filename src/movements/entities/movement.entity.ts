import { MemberEntity } from "src/members/entities/member.entity";
import { SplitEntity } from "../splits/entities/split.entity";
import { PaymentEntity } from "../payments/entities/payment.entity";
import { Movement } from "prisma/generated/client";
import { ExpenseEntity } from "../expenses/entities/expense.entity";
import { TransferEntity } from "../transfers/entities/transfer.entity";

export class MovementEntity implements Movement {
  id: string;
  groupId: string;
  title: string;
  imageUris: string[];
  createdAt: Date;
  date: Date;
  createdById: string;

  createdBy?: MemberEntity;
  expenses?: ExpenseEntity[];
  splits?: SplitEntity[];
  payments?: PaymentEntity[];
  transfers?: TransferEntity[];
}
