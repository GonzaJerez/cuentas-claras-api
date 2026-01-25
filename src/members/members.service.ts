import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { DatabaseService } from "../config/database/database.service";
import { UserEntity } from "src/users/entities/user.entity";
import { MemberRole, MemberState } from "prisma/generated/enums";
import { MemberResponse } from "./dto/responses/member.response";
import { MemberEntity } from "./entities/member.entity";
import { MEMBER_COLORS, MemberColor } from "./constants/member-colors";

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

    // This method is only allowed to update the member of the current user
    if (member.userId !== user.id) {
      throw new ForbiddenException("You are not allowed to update this member");
    }

    const updatedMember = await this.db.member.update({
      where: { id },
      data: updateMemberDto,
      include: {
        user: true,
        // user: {
        //   select: {
        //     name: true,
        //     email: true,
        //   },
        // },
      },
    });
    console.dir({ updatedMember }, { depth: null });

    return MemberResponse.fromEntity(updatedMember);

    // return {
    //   id: updatedMember.id,
    //   name: updatedMember.user.name,
    //   email: updatedMember.user.email || null,
    //   role: updatedMember.role,
    //   defaultSplit: updatedMember.defaultSplit || null,
    // };
  }

  async checkIsGroupAdmin(groupId: string, user: UserEntity): Promise<void> {
    const member = await this.checkIsAGroupMember(groupId, user);

    if (!member.role.includes(MemberRole.ADMIN)) {
      throw new ForbiddenException(
        "You are not allowed to perform this action",
      );
    }
  }

  async checkIsAGroupMember(
    groupId: string,
    user: UserEntity,
  ): Promise<MemberEntity> {
    const member = await this.db.member.findFirst({
      where: {
        userId: user.id,
        groupId,
        state: MemberState.ACTIVE,
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new ForbiddenException("User is not a member of the group");
    }

    return member;
  }

  // /**
  //  * Gets the color to assign to a new member in a group.
  //  * The first member gets a random color, subsequent members get sequential colors.
  //  * @param groupId The ID of the group
  //  * @param tx Optional transaction client (for use within transactions)
  //  * @returns The color and backgroundColor to assign to the new member
  //  */
  // async getColorForNewMember(groupId: string, tx?: any): Promise<MemberColor> {
  //   const db = tx || this.db;

  //   // Count existing active members in the group
  //   const existingMemberCount = await db.member.count({
  //     where: {
  //       groupId,
  //       state: MemberState.ACTIVE,
  //     },
  //   });

  //   return getColorForNewMember(groupId, existingMemberCount);
  // }

  async getColorForNewMember(groupId: string): Promise<MemberColor> {
    const lastMember = await this.db.member.findFirst({
      where: { groupId },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });

    const lastIndex = MEMBER_COLORS.findIndex(
      (memberColor) => memberColor.color === lastMember?.color,
    );

    const newColor = MEMBER_COLORS[(lastIndex + 1) % MEMBER_COLORS.length];

    return newColor;
  }
}
