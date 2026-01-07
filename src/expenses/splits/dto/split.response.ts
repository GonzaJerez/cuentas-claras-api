import { MemberResponse } from "src/members/dto/responses/member.response";
import { SplitEntity } from "../entities/split.entity";
import { MemberEntity } from "src/members/entities/member.entity";
import { UserEntity } from "src/users/entities/user.entity";

export class SplitResponse {
  id: string;
  amount: number;
  member: MemberResponse;

  static fromEntity(
    split: SplitEntity & { member: MemberEntity & { user: UserEntity } },
  ): SplitResponse {
    return {
      id: split.id,
      amount: split.amount,
      member: MemberResponse.fromEntity(split.member),
    };
  }
}
