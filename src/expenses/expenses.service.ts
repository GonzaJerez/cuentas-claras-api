import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { DatabaseService } from "../config/database/database.service";
import { PaymentsService } from "./payments/payments.service";
import { SplitsService } from "./splits/splits.service";
import { UserEntity } from "src/users/entities/user.entity";
import { ExpenseResponse } from "./dto/responses/expense.response";
import { ExpenseByCategoryEntity } from "./entities/expense-by-category.entity";
import { AiContext } from "src/ai/dto/ai-context.dto";
import { AiExpenseTemplateDto } from "./dto/ai-expense-template.dto";
import { MemberState, SplitType } from "prisma/generated/enums";
import { CategoryState } from "prisma/generated/enums";
import { AiService } from "src/ai/providers/ai.service";
import { RawAiExpenseData } from "src/ai/dto/raw-ai-expense-data.dto";
import { MemberEntity } from "src/members/entities/member.entity";
import { GroupEntity } from "src/groups/entities/group.entity";

@Injectable()
export class ExpensesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly paymentsService: PaymentsService,
    private readonly splitsService: SplitsService,
    @Inject(AiService)
    private readonly aiService: AiService,
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

  async analyzeAudio(
    file: Express.Multer.File,
    groupId: string,
    user: UserEntity,
  ): Promise<AiExpenseTemplateDto> {
    const { context, members, categories, group, currentMember } =
      await this.getContextToAnalize(groupId, user);

    // Analyze with AI
    const fileBuffer = Buffer.from(file.buffer);
    const rawData = await this.aiService.analyzeAudio(
      fileBuffer,
      file.mimetype,
      context,
    );

    // Map and return
    return this.mapRawDataToTemplate({
      rawData,
      members,
      categories,
      currentMember,
      group,
    });
  }

  async analyzeImages(
    files: Express.Multer.File[],
    groupId: string,
    user: UserEntity,
  ): Promise<AiExpenseTemplateDto> {
    const { context, members, categories, group, currentMember } =
      await this.getContextToAnalize(groupId, user);

    // Prepare images
    const images = files.map((file) => ({
      buffer: Buffer.from(file.buffer),
      mimeType: file.mimetype,
    }));

    // Analyze with AI
    const rawData = await this.aiService.analyzeImages(images, context);
    console.dir({ rawData }, { depth: null });

    // Map and return
    const template = this.mapRawDataToTemplate({
      rawData,
      members,
      categories,
      currentMember,
      group,
    });
    console.dir({ template }, { depth: null });
    return template;
  }

  private async getContextToAnalize(
    groupId: string,
    user: UserEntity,
  ): Promise<{
    group: GroupEntity;
    members: Array<MemberEntity>;
    categories: Array<{ id: string; name: string }>;
    context: AiContext;
    currentMember: MemberEntity;
  }> {
    // Get group
    const group = await this.db.group.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException("Group not found");
    }

    // Verify user is member of group
    const member = await this.db.member.findFirst({
      where: {
        groupId,
        userId: user.id,
        state: MemberState.ACTIVE,
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new NotFoundException("User is not a member of the group");
    }

    // Get active members
    const members = await this.db.member.findMany({
      where: {
        groupId,
        state: MemberState.ACTIVE,
      },
      include: {
        user: true,
      },
    });

    // Get active categories
    const categories = await this.db.category.findMany({
      where: {
        groupId,
        state: CategoryState.ACTIVE,
      },
    });

    // Build context
    const context: AiContext = {
      memberNames: members.map((m) => m.user.name),
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
    };

    return {
      group,
      members,
      categories,
      context,
      currentMember: member,
    };
  }

  private mapRawDataToTemplate({
    rawData,
    categories,
    currentMember,
    members,
    group,
  }: {
    rawData: RawAiExpenseData;
    members: Array<MemberEntity>;
    categories: Array<{ id: string; name: string }>;
    currentMember: MemberEntity;
    group: GroupEntity;
  }): AiExpenseTemplateDto {
    // Map category names to IDs
    const categoryAmounts = rawData.detectedCategoryAmounts?.length
      ? (rawData.detectedCategoryAmounts
          .map((cat) => {
            const category = categories.find(
              (c) => c.name.toLowerCase() === cat.categoryName.toLowerCase(),
            );
            if (!category) return null;
            return {
              categoryId: category.id,
              categoryName: category.name,
              amount: cat.amount,
              items: cat.items,
            };
          })
          .filter((cat) => cat !== null) as Array<{
          categoryId: string;
          categoryName: string;
          amount: number;
          items?: string;
        }>)
      : [];

    // If no categories detected, use first category with total amount
    if (categoryAmounts.length === 0 && categories.length > 0) {
      const totalAmount =
        rawData.detectedCategoryAmounts?.reduce(
          (sum, cat) => sum + cat.amount,
          0,
        ) || 0;
      categoryAmounts.push({
        categoryId: categories[0].id,
        categoryName: categories[0].name,
        amount: totalAmount,
      });
    }

    const totalAmount = categoryAmounts.reduce(
      (sum, cat) => sum + cat.amount,
      0,
    );

    // Map payment names to member IDs
    const payments =
      rawData.detectedPayments?.length && rawData.detectedPayments.length > 0
        ? (rawData.detectedPayments
            .map((payment) => {
              const member = members.find(
                (m) =>
                  m.user.name.toLowerCase() ===
                  payment.memberName.toLowerCase(),
              );
              if (!member) return null;
              return {
                memberId: member.id,
                amount: payment.amount ?? totalAmount,
                memberName: member.user.name,
              };
            })
            .filter((p) => p !== null) as Array<{
            memberId: string;
            amount: number;
            memberName: string;
          }>)
        : [];

    // If no payments detected, use current user
    if (payments.length === 0) {
      payments.push({
        memberId: currentMember.id,
        amount: totalAmount,
        memberName: currentMember.user.name,
      });
    }

    // // Map split names to member IDs
    // let splits =
    //   rawData.detectedSplits?.length && rawData.detectedSplits.length > 0
    //     ? (rawData.detectedSplits
    //         .map((split) => {
    //           const member = members.find(
    //             (m) =>
    //               m.user.name.toLowerCase() === split.memberName.toLowerCase(),
    //           );
    //           if (!member) return null;
    //           return {
    //             memberId: member.id,
    //             amount: split.amount ?? 0,
    //             memberName: member.user.name,
    //           };
    //         })
    //         .filter((s) => s !== null) as Array<{
    //         memberId: string;
    //         amount: number;
    //         memberName: string;
    //       }>)
    //     : [];

    // // If no splits detected, divide equally among all members
    // if (splits.length === 0) {
    //   const amountPerMember = totalAmount / members.length;
    //   splits = members.map((m) => ({
    //     memberId: m.id,
    //     amount: amountPerMember,
    //     memberName: m.user.name,
    //   }));
    // } else {
    //   // If some splits don't have amounts, divide remaining equally
    //   const splitsWithAmounts = splits.filter((s) => s.amount > 0);
    //   const totalSplitAmount = splitsWithAmounts.reduce(
    //     (sum, s) => sum + s.amount,
    //     0,
    //   );
    //   const remainingAmount = totalAmount - totalSplitAmount;
    //   const splitsWithoutAmounts = splits.filter((s) => s.amount === 0);
    //   const amountPerRemaining =
    //     splitsWithoutAmounts.length > 0
    //       ? remainingAmount / splitsWithoutAmounts.length
    //       : 0;

    //   splits = splits.map((s) => ({
    //     ...s,
    //     amount: s.amount > 0 ? s.amount : amountPerRemaining,
    //   }));
    // }

    const splits = members.map((m) => {
      let amount = 0;

      if (group.splitType === SplitType.EQUAL) {
        amount = totalAmount / members.length;
      } else {
        amount = m.defaultSplit ? totalAmount * (m.defaultSplit / 100) : 0;
      }
      return {
        memberId: m.id,
        amount,
        memberName: m.user.name,
      };
    });

    return {
      title: rawData.title,
      date: rawData.date || new Date().toISOString(),
      description: rawData.description || "",
      categoryAmounts,
      payments,
      splits,
    };
  }
}
