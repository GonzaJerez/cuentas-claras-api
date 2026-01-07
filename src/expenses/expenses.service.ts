import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { DatabaseService } from "../config/database/database.service";
import { PaymentsService } from "./payments/payments.service";
import { SplitsService } from "./splits/splits.service";
import { UserEntity } from "src/users/entities/user.entity";
import { ExpenseResponse } from "./dto/responses/expense.response";
import { ExpenseByCategoryEntity } from "./entities/expense-category.entity";

@Injectable()
export class ExpensesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly paymentsService: PaymentsService,
    private readonly splitsService: SplitsService,
  ) {}

  async create(
    createExpenseDto: CreateExpenseDto,
    user: UserEntity,
  ): Promise<ExpenseResponse> {
    const expensesByCategory: ExpenseByCategoryEntity[] = [];

    const member = await this.db.member.findFirst({
      where: {
        groupId: createExpenseDto.groupId,
        userId: user.id,
      },
    });

    if (!member) {
      throw new NotFoundException("User is not a member of the group");
    }

    const { payments, splits, categoryAmounts, ...expenseData } =
      createExpenseDto;

    const expenseCreated = await this.db.$transaction(async (tx) => {
      // Create Expense
      const expense = await tx.expense.create({
        data: {
          ...expenseData,
          groupId: expenseData.groupId,
          createdById: member.id,
          date: expenseData.date ?? new Date(),
        },
        include: {
          byCategory: {
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

      // Create Expenses By Categories
      for (const categoryAmount of categoryAmounts) {
        const expenseByCategory = await tx.expenseByCategory.create({
          data: {
            expenseId: expense.id,
            categoryId: categoryAmount.categoryId,
            amount: categoryAmount.amount,
          },
        });
        expensesByCategory.push(expenseByCategory);
      }

      // Create Payments
      for (const payment of payments) {
        await this.paymentsService.create(
          {
            ...payment,
            expenseId: expense.id,
          },
          tx,
        );
      }

      // Create Splits
      for (const split of splits) {
        await this.splitsService.create(
          {
            ...split,
            expenseId: expense.id,
          },
          tx,
        );
      }

      // Reload expense with all relations
      return tx.expense.findUnique({
        where: { id: expense.id },
        include: {
          byCategory: {
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

    if (!expenseCreated) {
      throw new InternalServerErrorException("Failed to create expense");
    }

    return ExpenseResponse.fromEntity(expenseCreated);
  }

  findAll() {
    return this.db.expense.findMany({
      include: {
        byCategory: {
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
  }

  findOne(id: string) {
    return this.db.expense.findUnique({
      where: { id },
      include: {
        byCategory: {
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
  }

  update(id: string, updateExpenseDto: UpdateExpenseDto) {
    // Handling update with payments/splits is complex (delete/recreate or update diff).
    // For now simple update of expense fields.
    // If payments/splits are included, implementing full sync logic would be better.
    // User requested "payments and splits unicamente se van a crear cuando se cree un expense, y tambien se van a poder editar cuando se edite un expense".

    // Simplest approach: Delete existing related records and recreate if provided in DTO.
    // Or just update expense fields if no payments/splits provided.

    const { payments, splits, categoryAmounts, ...expenseData } =
      updateExpenseDto;

    return this.db.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id },
        data: expenseData,
      });

      if (categoryAmounts) {
        await tx.expenseByCategory.deleteMany({ where: { expenseId: id } });
        for (const categoryAmount of categoryAmounts) {
          await tx.expenseByCategory.create({
            data: {
              expenseId: id,
              categoryId: categoryAmount.categoryId,
              amount: categoryAmount.amount,
            },
          });
        }
      }

      if (payments) {
        // This assumes replacing all payments.
        // Real world app might want smarter updates.
        // But for "CRUD necessary", this works.
        // Wait, payments module has delete logic exposed via service but tx?
        // PaymentsService.remove doesn't accept tx. I should add it or use tx.payment.deleteMany.
        await tx.payment.deleteMany({ where: { expenseId: id } });
        for (const payment of payments) {
          await this.paymentsService.create({ ...payment, expenseId: id }, tx);
        }
      }

      if (splits) {
        await tx.split.deleteMany({ where: { expenseId: id } });
        for (const split of splits) {
          await this.splitsService.create({ ...split, expenseId: id }, tx);
        }
      }

      // Reload expense with all relations
      return tx.expense.findUnique({
        where: { id },
        include: {
          byCategory: {
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
    });
  }

  remove(id: string) {
    return this.db.expense.delete({
      where: { id },
    });
  }
}
