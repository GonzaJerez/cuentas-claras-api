import { MemberEntity } from "src/members/entities/member.entity";
import { SplitEntity } from "../splits/entities/split.entity";
import { PaymentEntity } from "../payments/entities/payment.entity";
import { Movement } from "prisma/generated/client";
import { AmountByCategoryEntity } from "src/movements/amounts-by-categories/entities/amount-by-category.entity";

export class MovementEntity implements Movement {
  id: string;
  groupId: string;
  title: string;
  imageUris: string[];
  createdAt: Date;
  date: Date;
  createdById: string;

  createdBy?: MemberEntity;
  amountsByCategories?: AmountByCategoryEntity[];
  splits?: SplitEntity[];
  payments?: PaymentEntity[];
}
