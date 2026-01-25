import { Transfer } from "prisma/generated/client";
import { MemberEntity } from "src/members/entities/member.entity";
import { MovementEntity } from "src/movements/entities/movement.entity";

export class TransferEntity implements Transfer {
  id: string;
  amount: number;
  description: string | null;
  movementId: string;
  fromMemberId: string;
  toMemberId: string;

  movement?: MovementEntity;
  fromMember?: MemberEntity;
  toMember?: MemberEntity;
}
