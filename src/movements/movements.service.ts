import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateMovementDto } from "./dto/create-movement.dto";
import { UpdateMovementDto } from "./dto/update-movement.dto";
import { DatabaseService } from "../config/database/database.service";
import { PaymentsService } from "./payments/payments.service";
import { SplitsService } from "./splits/splits.service";
import { UserEntity } from "src/users/entities/user.entity";
import { MemberState } from "prisma/generated/enums";
import { AmountByCategoryService } from "./amounts-by-categories/amount-by-category.service";
import { MovementMinimalResponse } from "./dto/responses/movement-minimal.response";
import { MovementDetailResponse } from "./dto/responses/movement-detail.response";

@Injectable()
export class MovementsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly paymentsService: PaymentsService,
    private readonly splitsService: SplitsService,
    private readonly amountByCategoryService: AmountByCategoryService,
  ) {}

  async create(
    createExpenseDto: CreateMovementDto,
    user: UserEntity,
  ): Promise<MovementDetailResponse> {
    // const expensesByCategory: ExpenseEntity[] = [];

    const member = await this.db.member.findFirst({
      where: {
        groupId: createExpenseDto.groupId,
        userId: user.id,
      },
    });

    if (!member) {
      throw new NotFoundException("User is not a member of the group");
    }

    const {
      payments,
      splits,
      amountsByCategories: expenses,
      ...expenseData
    } = createExpenseDto;

    const movementCreated = await this.db.$transaction(async (tx) => {
      // Create Expense
      const movement = await tx.movement.create({
        data: {
          ...expenseData,
          groupId: expenseData.groupId,
          createdById: member.id,
          date: expenseData.date ?? new Date(),
        },
      });

      // Create Expenses By Categories
      for (const expense of expenses) {
        await this.amountByCategoryService.create(movement.id, expense, tx);
      }

      // Create Payments
      for (const payment of payments) {
        await this.paymentsService.create(movement.id, payment, tx);
      }

      // Create Splits
      for (const split of splits) {
        await this.splitsService.create(movement.id, split, tx);
      }

      // Reload expense with all relations
      return tx.movement.findUnique({
        where: { id: movement.id },
        include: {
          amountsByCategories: {
            include: {
              category: true,
            },
          },
          splits: {
            include: {
              member: {
                include: {
                  user: true,
                },
              },
            },
          },
          payments: {
            include: {
              member: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });
    });

    if (!movementCreated) {
      throw new InternalServerErrorException("Failed to create expense");
    }

    return MovementDetailResponse.fromEntity(movementCreated);
  }

  async findAll(): Promise<MovementMinimalResponse[]> {
    const movements = await this.db.movement.findMany({
      include: {
        amountsByCategories: {
          include: {
            category: true,
          },
        },
        payments: {
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
        },
        splits: {
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return movements.map(MovementMinimalResponse.fromEntity);
  }

  async findOne(id: string, user: UserEntity): Promise<MovementDetailResponse> {
    const groups = await this.db.group.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
            state: MemberState.ACTIVE,
          },
        },
      },
    });

    if (groups.length === 0) {
      throw new NotFoundException("User is not a member of any group");
    }

    const movement = await this.db.movement.findUnique({
      where: { id, groupId: { in: groups.map((group) => group.id) } },
      include: {
        amountsByCategories: {
          include: {
            category: true,
          },
        },
        payments: {
          include: {
            member: {
              include: {
                user: true,
              },
            },
            receiver: {
              include: {
                user: true,
              },
            },
          },
        },
        splits: {
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!movement) {
      throw new NotFoundException("Movement not found");
    }

    return MovementDetailResponse.fromEntity(movement);
  }

  async update(
    id: string,
    updateExpenseDto: UpdateMovementDto,
    user: UserEntity,
  ) {
    console.dir({ updateExpenseDto }, { depth: null });
    const member = await this.db.member.findFirst({
      where: {
        groupId: updateExpenseDto.groupId,
        userId: user.id,
      },
    });

    if (!member) {
      throw new NotFoundException("User is not a member of the group");
    }

    const {
      payments = [],
      splits = [],
      amountsByCategories = [],
      ...expenseData
    } = updateExpenseDto;

    const movementUpdated = await this.db.$transaction(async (tx) => {
      // Update Expense
      const movement = await tx.movement.update({
        where: { id },
        data: {
          ...expenseData,
          groupId: expenseData.groupId,
          createdById: member.id,
          date: expenseData.date ?? new Date(),
        },
      });

      // Update Amounts By Categories
      await tx.amountByCategory.deleteMany({
        where: { movementId: movement.id },
      });
      for (const amountByCategory of amountsByCategories) {
        await this.amountByCategoryService.create(
          movement.id,
          amountByCategory,
          tx,
        );
      }

      // Update Payments
      await tx.payment.deleteMany({
        where: { movementId: movement.id },
      });
      for (const payment of payments) {
        await this.paymentsService.create(movement.id, payment, tx);
      }

      // Update Splits
      await tx.split.deleteMany({
        where: { movementId: movement.id },
      });
      for (const split of splits) {
        await this.splitsService.create(movement.id, split, tx);
      }

      // Reload expense with all relations
      return tx.movement.findUnique({
        where: { id: movement.id },
        include: {
          amountsByCategories: {
            include: {
              category: true,
            },
          },
          splits: {
            include: {
              member: {
                include: {
                  user: true,
                },
              },
            },
          },
          payments: {
            include: {
              member: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });
    });

    if (!movementUpdated) {
      throw new InternalServerErrorException("Failed to create expense");
    }

    return MovementDetailResponse.fromEntity(movementUpdated);
  }

  remove(id: string) {
    return this.db.movement.delete({
      where: { id },
    });
  }
}
