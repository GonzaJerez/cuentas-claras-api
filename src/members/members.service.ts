import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { DatabaseService } from "../config/database/database.service";
import { UserEntity } from "src/users/entities/user.entity";
import { MemberState } from "prisma/generated/enums";
import { MemberResponse } from "./dto/responses/member.response";

@Injectable()
export class MembersService {
  constructor(private readonly db: DatabaseService) {}

  async update(
    id: string,
    updateMemberDto: UpdateMemberDto,
    user: UserEntity,
  ): Promise<MemberResponse> {
    if (updateMemberDto.state && updateMemberDto.state !== MemberState.LEFT) {
      throw new ForbiddenException(
        "This method only allows to update the state of the member to LEFT",
      );
    }

    const member = await this.db.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException("Member not found");
    }

    if (member.userId !== user.id) {
      throw new ForbiddenException("You are not allowed to update this member");
    }
    const updatedMember = await this.db.member.update({
      where: { id },
      data: updateMemberDto,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      id: updatedMember.id,
      name: updatedMember.user.name,
      email: updatedMember.user.email || null,
      role: updatedMember.role,
      defaultSplit: updatedMember.defaultSplit || null,
    };
  }
}
