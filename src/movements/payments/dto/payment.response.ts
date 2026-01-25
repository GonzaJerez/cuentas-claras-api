import { MemberResponse } from "src/members/dto/responses/member.response";
import { PaymentEntity } from "../entities/payment.entity";

export class PaymentResponse {
  id: string;
  amount: number;
  member: MemberResponse;

  static fromEntity(entity: PaymentEntity): PaymentResponse {
    return {
      id: entity.id,
      amount: entity.amount,
      member: MemberResponse.fromEntity(entity.member),
    };
  }
}
