import { MemberResponse } from "src/members/dto/responses/member.response";
import { PaymentEntity } from "../entities/payment.entity";

export class PaymentResponse {
  id: string;
  amount: number;
  member: MemberResponse;
  receiver?: MemberResponse;

  static fromEntity(entity: PaymentEntity): PaymentResponse {
    return {
      id: entity.id,
      amount: entity.amount,
      member: MemberResponse.fromEntity(entity.member),
      receiver: entity.receiver
        ? MemberResponse.fromEntity(entity.receiver)
        : undefined,
    };
  }
}
