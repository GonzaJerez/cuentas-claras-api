import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { DatabaseService } from "../config/database/database.service";
import { UserEntity } from "src/users/entities/user.entity";
import { SplitType } from "@prisma/client";
import { MemberRole, MemberState, UserRole } from "prisma/generated/enums";
import { GroupsFiltersDto } from "./dto/filters.dto";
import { ListGroupResponse } from "./dto/responses/list-group.response";
import { GroupDetailsResponse } from "./dto/responses/group-details.response";
import { GroupResponse } from "./dto/responses/group.response";
import { NANOID_ALPHABET } from "src/shared/constants/nanoid-alphabet";
import { customAlphabet } from "nanoid";
import { JoinGroupDto } from "./dto/join-group.dto";
import { MemberResponse } from "src/members/dto/responses/member.response";
import { UpdateMemberWithGroupDto } from "src/members/dto/update-member-with-group.dto";
import { CategoriesService } from "src/categories/categories.service";
import { ExpenseListResponse } from "src/expenses/dto/responses/expense-list.response";

const USER_SELECT = {
  select: {
    id: true,
    name: true,
    email: true,
    initials: true,
    state: true,
    role: true,
  },
};

@Injectable()
export class GroupsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(
    createGroupDto: CreateGroupDto,
    user: UserEntity,
  ): Promise<GroupResponse> {
    const memberCode = customAlphabet(NANOID_ALPHABET, 12)();

    const groupCreated = await this.db.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: createGroupDto.name,
          splitType: SplitType.EQUAL,
          members: {
            create: {
              userId: user.id,
              role: [MemberRole.CREATOR, MemberRole.ADMIN],
              code: memberCode,
            },
          },
        },
        include: {
          members: {
            where: {
              state: MemberState.ACTIVE,
            },
            include: {
              user: USER_SELECT,
            },
          },
        },
      });

      await this.categoriesService.createInitialCategories(group.id, tx);

      return group;
    });

    return {
      id: groupCreated.id,
      name: groupCreated.name,
      description: groupCreated.description,
      createdAt: groupCreated.createdAt,
      splitType: groupCreated.splitType,
      members: groupCreated.members.map(MemberResponse.fromEntity),
    };
  }

  async findAll(
    filters: GroupsFiltersDto,
    user: UserEntity,
  ): Promise<ListGroupResponse[]> {
    const { page = 1, limit = 20, userId } = filters;

    if (userId && userId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        "You are not allowed to access this resource",
      );
    }

    const groups = await this.db.group.findMany({
      where: {
        members: {
          some: { userId: userId || user.id },
        },
      },
      include: {
        members: {
          where: {
            state: MemberState.ACTIVE,
          },
          select: {
            id: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
      splitType: group.splitType,
      membersCount: group.members.length,
    }));
  }

  async findOne(id: string, user: UserEntity): Promise<GroupDetailsResponse> {
    const group = await this.db.group.findUnique({
      where: { id },
      include: {
        members: {
          where: {
            OR: [
              {
                state: MemberState.ACTIVE,
              },
              {
                state: MemberState.PENDING,
              },
            ],
          },
          include: {
            user: USER_SELECT,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException("Group not found");
    }

    if (!group.members.some((member) => member.userId === user.id)) {
      throw new ForbiddenException("You are not a member of this group");
    }

    const lastExpenses = await this.db.expense.findMany({
      where: { groupId: id },
      // include: {
      //   category: {
      //     select: {
      //       id: true,
      //       name: true,
      //       icon: true,
      //     },
      //   },
      // },
      orderBy: {
        date: "desc",
      },
      take: 5,
    });

    // const categories = await this.db.category.findMany({
    //   where: { groupId: id },
    //   select: {
    //     id: true,
    //     name: true,
    //     icon: true,
    //   },
    // });

    // TODO: Calculate balance

    return {
      ...group,
      members: group.members.map(MemberResponse.fromEntity),
      lastExpenses: lastExpenses.map(ExpenseListResponse.fromEntity),
      balance: 0,
      // categories,
    };
  }

  async update(
    id: string,
    updateGroupDto: UpdateGroupDto,
    user: UserEntity,
  ): Promise<GroupResponse> {
    // Get the user's member of the group
    const userMember = await this.db.member.findFirst({
      where: { groupId: id, userId: user.id },
      select: {
        role: true,
        id: true,
      },
    });

    if (!userMember) {
      throw new ForbiddenException("You are not a member of this group");
    }

    // Check if the user is an admin of the group
    if (!userMember.role.includes(MemberRole.ADMIN)) {
      throw new ForbiddenException("You are not allowed to update this group");
    }

    const membersToUpdate = updateGroupDto.membersToUpdate || [];

    // Validate defaultSplit updates
    await this.validateMembersSplits(id, membersToUpdate);

    await this.db.$transaction(async (tx) => {
      // Update the members of the group
      for (const memberToUpdateDto of membersToUpdate) {
        const member = await tx.member.findUnique({
          where: { id: memberToUpdateDto.id, groupId: id },
        });

        if (!member) {
          throw new NotFoundException(
            `Member with id ${memberToUpdateDto.id} not found`,
          );
        }

        // Allow to update the state of the member to the new state if the new state is REMOVED to delete the member from the group,
        // or if the current state is PENDING and the new state is ACTIVE to activate the member
        // If the current state is LEFT, do nothing, to reactivate the member must use the join method
        let newState = member?.state;
        let memberCode: string | null = null;

        switch (memberToUpdateDto.state) {
          case MemberState.LEFT:
            throw new BadRequestException(
              "To remove a member, use the REMOVED state instead tha LEFT state",
            );
          case MemberState.PENDING:
            throw new BadRequestException(
              "Cannot update the state of a member to PENDING",
            );
          case MemberState.REMOVED:
            if (member.state !== MemberState.ACTIVE) {
              throw new BadRequestException(
                `The member with id ${memberToUpdateDto.id} is not a member of the group`,
              );
            }
            newState = MemberState.REMOVED;
            memberCode = null;
            break;
          case MemberState.ACTIVE:
            if (member.state === MemberState.ACTIVE) {
              throw new BadRequestException(
                `The member with id ${memberToUpdateDto.id} is already in the group`,
              );
            }
            if (member.state === MemberState.LEFT) {
              throw new ForbiddenException(
                "You cannot reactivate a member that has left the group",
              );
            }
            if (
              member.state === MemberState.PENDING ||
              member.state === MemberState.REMOVED
            ) {
              newState = MemberState.ACTIVE;
              memberCode = customAlphabet(NANOID_ALPHABET, 12)();
            }
            break;
        }

        // If any member has a defaultSplit value, update the splitType to PERCENTAGE
        if (memberToUpdateDto.defaultSplit) {
          updateGroupDto.splitType = SplitType.PERCENTAGE;
        }

        await tx.member.update({
          where: { id: memberToUpdateDto.id, groupId: id },
          data: {
            ...memberToUpdateDto,
            state: newState,
            code: memberCode,
          },
        });
      }

      // Update the group fields
      if (
        updateGroupDto.splitType ||
        updateGroupDto.description ||
        updateGroupDto.name
      ) {
        await tx.group.update({
          where: { id },
          data: {
            splitType: updateGroupDto.splitType,
            description: updateGroupDto.description,
            name: updateGroupDto.name,
          },
        });
      }
    });

    // Get the updated group with members
    const updatedGroup = await this.db.group.findUniqueOrThrow({
      where: { id },
      include: {
        members: {
          where: {
            state: MemberState.ACTIVE,
          },
          include: {
            user: USER_SELECT,
          },
        },
      },
    });

    return {
      id: updatedGroup.id,
      name: updatedGroup.name,
      description: updatedGroup.description,
      splitType: updatedGroup.splitType,
      createdAt: updatedGroup.createdAt,
      members: updatedGroup.members.map(MemberResponse.fromEntity),
    };
  }

  async getGroupByCode(code: string, user: UserEntity): Promise<GroupResponse> {
    const member = await this.validateCodeToJoin(code, user);

    return {
      id: member.group.id,
      name: member.group.name,
      description: member.group.description,
      createdAt: member.group.createdAt,
      splitType: member.group.splitType,
      members: member.group.members.map(MemberResponse.fromEntity),
    };
  }

  async join(
    joinGroupDto: JoinGroupDto,
    user: UserEntity,
  ): Promise<MemberResponse> {
    const invitator = await this.validateCodeToJoin(joinGroupDto.code, user);
    const memberCode = customAlphabet(NANOID_ALPHABET, 12)();

    // If the user already left the group, reactivate them
    const memberLeftGroup = invitator.group.members.find(
      (m) => m.userId === user.id && m.state === MemberState.LEFT,
    );

    if (memberLeftGroup) {
      const updatedMember = await this.db.member.update({
        where: { id: memberLeftGroup.id },
        data: {
          state: MemberState.ACTIVE,
          code: memberCode,
        },
        include: {
          user: true,
        },
      });

      return MemberResponse.fromEntity(updatedMember);
    }

    // If the user was removed from the group, add them to the pending list
    const memberWasRemoved = invitator.group.members.find(
      (m) => m.userId === user.id && m.state === MemberState.REMOVED,
    );

    if (memberWasRemoved) {
      const updatedMember = await this.db.member.update({
        where: { id: memberWasRemoved.id },
        data: {
          state: MemberState.PENDING,
        },
        include: {
          user: true,
        },
      });

      return MemberResponse.fromEntity(updatedMember);
    }

    // If the user is already a pending member of the group, throw an error
    const memberPending = invitator.group.members.find(
      (m) => m.userId === user.id && m.state === MemberState.PENDING,
    );

    if (memberPending) {
      throw new BadRequestException(
        "You are already a pending member of this group",
      );
    }

    // If the user is not a member of the group, add them to the group
    const member = await this.db.member.create({
      data: {
        groupId: invitator.group.id,
        userId: user.id,
        invitedById: invitator.id,
        code: memberCode,
      },
      include: {
        user: true,
      },
    });

    return MemberResponse.fromEntity(member);
  }

  private async validateCodeToJoin(code: string, user: UserEntity) {
    const invitator = await this.db.member.findFirst({
      where: { code },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: USER_SELECT,
              },
            },
          },
        },
      },
    });

    if (!invitator || invitator.state !== MemberState.ACTIVE) {
      throw new NotFoundException("Group not found");
    }

    if (
      invitator.group.members.some(
        (member) =>
          member.userId === user.id && member.state === MemberState.ACTIVE,
      )
    ) {
      throw new BadRequestException("You are already a member of this group");
    }

    return invitator;
  }

  private async validateMembersSplits(
    groupId: string,
    membersToUpdate: UpdateMemberWithGroupDto[],
  ) {
    if (membersToUpdate.length > 0) {
      // Check if any member has a numeric defaultSplit value
      const membersWithDefaultSplit = membersToUpdate.filter(
        (m) => m.defaultSplit !== undefined && m.defaultSplit !== null,
      );
      const membersWithoutDefaultSplit = membersToUpdate.filter(
        (m) => m.defaultSplit === undefined || m.defaultSplit === null,
      );

      // If some members have defaultSplit and others don't, throw an error
      if (
        membersWithDefaultSplit.length > 0 &&
        membersWithoutDefaultSplit.length > 0
      ) {
        throw new BadRequestException(
          "If any member has a defaultSplit value, all members to update must have a defaultSplit value",
        );
      }

      // If any member is being updated with defaultSplit, all active members must be updated
      if (membersWithDefaultSplit.length > 0) {
        // Get all active members of the group
        const activeMembers = await this.db.member.findMany({
          where: {
            groupId,
            state: MemberState.ACTIVE,
          },
          select: {
            id: true,
          },
        });

        // Check if all active members are included in the update
        const activeMemberIds = activeMembers.map((m) => m.id);
        const membersToUpdateIds = membersToUpdate.map((m) => m.id);
        const membersNotInUpdate = activeMemberIds.filter(
          (id) => !membersToUpdateIds.includes(id),
        );

        if (membersNotInUpdate.length > 0) {
          throw new BadRequestException(
            "If updating defaultSplit, all active members of the group must be included in the update. Members not included in the update: [" +
              membersNotInUpdate.join(", ") +
              "]",
          );
        }

        // Ensure the sum of all defaultSplit values is exactly 100
        const totalDefaultSplit = membersToUpdate.reduce(
          (sum, member) => sum + member.defaultSplit,
          0,
        );
        if (totalDefaultSplit !== 100) {
          throw new BadRequestException(
            `The sum of all defaultSplit values must be exactly 100. Current sum: ${totalDefaultSplit}`,
          );
        }
      }
    }
  }
}
