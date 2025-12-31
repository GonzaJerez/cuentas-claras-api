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

@Injectable()
export class GroupsService {
  constructor(private readonly db: DatabaseService) {}

  async create(
    createGroupDto: CreateGroupDto,
    user: UserEntity,
  ): Promise<GroupResponse> {
    const memberCode = customAlphabet(NANOID_ALPHABET, 12)();

    const group = await this.db.group.create({
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
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
      splitType: group.splitType,
      members: group.members.map((member) => ({
        id: member.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        defaultSplit: member.defaultSplit,
      })),
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
            user: {
              select: {
                name: true,
                email: true,
              },
            },
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
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 5,
    });

    const categories = await this.db.category.findMany({
      where: { groupId: id },
      select: {
        id: true,
        name: true,
        icon: true,
      },
    });

    // TODO: Calculate balance

    return {
      ...group,
      members: group.members.map((member) => ({
        id: member.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        defaultSplit: member.defaultSplit,
      })),
      lastExpenses: lastExpenses.map((expense) => ({
        id: expense.id,
        title: expense.title,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
      })),
      balance: 0,
      categories,
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

    await this.db.$transaction(async (tx) => {
      // Update the members of the group
      for (const member of updateGroupDto.membersToUpdate || []) {
        const currentMember = await tx.member.findUnique({
          where: { id: member.id, groupId: id },
        });

        // Allow to update the state of the member to the new state if the new state is REMOVED to delete the member from the group,
        // or if the current state is PENDING and the new state is ACTIVE to activate the member
        // If the current state is LEFT, do nothing, to reactivate the member must use the join method
        let newState = currentMember?.state;

        if (member.state === MemberState.REMOVED) {
          newState = MemberState.REMOVED;
        } else if (
          currentMember?.state === MemberState.PENDING &&
          member.state === MemberState.ACTIVE
        ) {
          newState = MemberState.ACTIVE;
        }

        await tx.member.update({
          where: { id: member.id, groupId: id },
          data: {
            ...member,
            state: newState,
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
          data: updateGroupDto,
        });
      }
    });

    // Get the updated group with members
    const updatedGroup = await this.db.group.findUniqueOrThrow({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
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
      members:
        updatedGroup.members.map((member) => ({
          id: member.id,
          name: member.user.name,
          email: member.user.email || null,
          role: member.role,
          defaultSplit: member.defaultSplit || null,
        })) || [],
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
      members: member.group.members.map((member) => ({
        id: member.id,
        name: member.user.name,
        email: member.user.email || null,
        role: member.role,
        defaultSplit: member.defaultSplit || null,
      })),
    };
  }

  async join(
    joinGroupDto: JoinGroupDto,
    user: UserEntity,
  ): Promise<GroupResponse> {
    const invitator = await this.validateCodeToJoin(joinGroupDto.code, user);

    // If the user already left the group, reactivate them
    const memberLeftGroup = invitator.group.members.find(
      (m) => m.userId === user.id && m.state === MemberState.LEFT,
    );

    if (memberLeftGroup) {
      const updatedMember = await this.db.member.update({
        where: { id: memberLeftGroup.id },
        data: {
          state: MemberState.ACTIVE,
        },
        include: {
          group: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return {
        id: updatedMember.group.id,
        name: updatedMember.group.name,
        description: updatedMember.group.description,
        createdAt: updatedMember.group.createdAt,
        splitType: updatedMember.group.splitType,
        members: updatedMember.group.members.map((m) => ({
          id: m.id,
          name: m.user.name,
          email: m.user.email || null,
          role: m.role,
          defaultSplit: m.defaultSplit || null,
        })),
      };
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
          group: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return {
        id: updatedMember.group.id,
        name: updatedMember.group.name,
        description: updatedMember.group.description,
        createdAt: updatedMember.group.createdAt,
        splitType: updatedMember.group.splitType,
        members: updatedMember.group.members.map((m) => ({
          id: m.id,
          name: m.user.name,
          email: m.user.email || null,
          role: m.role,
          defaultSplit: m.defaultSplit || null,
        })),
      };
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
      },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      id: member.group.id,
      name: member.group.name,
      description: member.group.description,
      createdAt: member.group.createdAt,
      splitType: member.group.splitType,
      members: member.group.members.map((m) => ({
        id: m.id,
        name: m.user.name,
        email: m.user.email || null,
        role: m.role,
        defaultSplit: m.defaultSplit || null,
      })),
    };
  }

  private async validateCodeToJoin(code: string, user: UserEntity) {
    const invitator = await this.db.member.findFirst({
      where: { code },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invitator || invitator.state === MemberState.REMOVED) {
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
}
