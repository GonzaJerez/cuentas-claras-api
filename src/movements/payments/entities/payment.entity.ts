import { Payment } from "prisma/generated/client";
import { MemberEntity } from "src/members/entities/member.entity";

export class PaymentEntity implements Payment {
  id: string;
  memberId: string;
  movementId: string;
  amount: number;

  member: MemberEntity;
}
