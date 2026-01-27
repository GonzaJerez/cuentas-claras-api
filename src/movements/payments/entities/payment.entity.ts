import { Payment } from "prisma/generated/client";
import { MemberEntity } from "src/members/entities/member.entity";
import { MovementEntity } from "src/movements/entities/movement.entity";

export class PaymentEntity implements Payment {
  id: string;
  memberId: string;
  movementId: string;
  amount: number;
  receiverId: string | null;

  member: MemberEntity;
  receiver?: MemberEntity | null;
  movement?: MovementEntity;
}
