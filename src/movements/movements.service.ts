import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { CreateMovementExpenseDto } from "./dto/create-movement-expense.dto";
import { UpdateExpenseDto } from "./dto/update-movement-expense.dto";
import { DatabaseService } from "../config/database/database.service";
import { PaymentsService } from "./payments/payments.service";
import { SplitsService } from "./splits/splits.service";
import { UserEntity } from "src/users/entities/user.entity";
import { MovementResponse } from "./dto/responses/movement.response";
import { AiContext } from "src/ai/dto/ai-context.dto";
import { AiExpenseTemplateDto } from "./dto/ai-expense-template.dto";
import { MemberState, SplitType } from "prisma/generated/enums";
import { CategoryState } from "prisma/generated/enums";
import { AiService } from "src/ai/providers/ai.service";
import { RawAiExpenseData } from "src/ai/dto/raw-ai-expense-data.dto";
import { MemberEntity } from "src/members/entities/member.entity";
import { GroupEntity } from "src/groups/entities/group.entity";
import { AnalyzeTextDto } from "./dto/analyze-text.dto";
import { ExpensesService } from "./expenses/expenses.service";

@Injectable()
export class MovementsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly paymentsService: PaymentsService,
    private readonly splitsService: SplitsService,
    @Inject(AiService)
    private readonly aiService: AiService,
    private readonly expensesService: ExpensesService,
  ) {}

  async create(
    createExpenseDto: CreateMovementExpenseDto,
    user: UserEntity,
  ): Promise<MovementResponse> {
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

    const { payments, splits, expenses, ...expenseData } = createExpenseDto;

    const movementCreated = await this.db.$transaction(async (tx) => {
      // Create Expense
      const movement = await tx.movement.create({
        data: {
          ...expenseData,
          groupId: expenseData.groupId,
          createdById: member.id,
          date: expenseData.date ?? new Date(),
        },
        include: {
          expenses: {
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
      for (const expense of expenses) {
        await this.expensesService.create(
          { ...expense, movementId: movement.id },
          tx,
        );
      }

      // Create Payments
      for (const payment of payments) {
        await this.paymentsService.create(
          {
            ...payment,
            movementId: movement.id,
          },
          tx,
        );
      }

      // Create Splits
      for (const split of splits) {
        await this.splitsService.create(
          {
            ...split,
            movementId: movement.id,
          },
          tx,
        );
      }

      // Reload expense with all relations
      return tx.movement.findUnique({
        where: { id: movement.id },
        include: {
          expenses: {
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

    return MovementResponse.fromEntity(movementCreated);
  }

  findAll() {
    return this.db.movement.findMany({
      include: {
        expenses: {
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
    return this.db.movement.findUnique({
      where: { id },
      include: {
        expenses: {
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
    console.log(updateExpenseDto, id);
    // Handling update with payments/splits is complex (delete/recreate or update diff).
    // For now simple update of expense fields.
    // If payments/splits are included, implementing full sync logic would be better.
    // User requested "payments and splits unicamente se van a crear cuando se cree un expense, y tambien se van a poder editar cuando se edite un expense".
    // Simplest approach: Delete existing related records and recreate if provided in DTO.
    // Or just update expense fields if no payments/splits provided.
    // const { payments, splits, expenses, ...expenseData } = updateExpenseDto;
    // return this.db.$transaction(async (tx) => {
    //   await tx.expense.update({
    //     where: { id },
    //     data: expenseData,
    //   });
    //   if (expenses) {
    //     await tx.expense.deleteMany({ where: { movementId: id } });
    //     for (const expense of expenses) {
    //       await this.expensesService.create({ ...expense, movementId: id }, tx);
    //     }
    //   }
    //   if (payments) {
    //     // This assumes replacing all payments.
    //     // Real world app might want smarter updates.
    //     // But for "CRUD necessary", this works.
    //     // Wait, payments module has delete logic exposed via service but tx?
    //     // PaymentsService.remove doesn't accept tx. I should add it or use tx.payment.deleteMany.
    //     await tx.payment.deleteMany({ where: { expenseId: id } });
    //     for (const payment of payments) {
    //       await this.paymentsService.create({ ...payment, movementId: id }, tx);
    //     }
    //   }
    //   if (splits) {
    //     await tx.split.deleteMany({ where: { expenseId: id } });
    //     for (const split of splits) {
    //       await this.splitsService.create({ ...split, movementId: id }, tx);
    //     }
    //   }
    //   // Reload expense with all relations
    //   return tx.expense.findUnique({
    //     where: { id },
    //     include: {
    //       byCategory: {
    //         include: {
    //           category: true,
    //         },
    //       },
    //       payments: {
    //         include: {
    //           member: {
    //             include: {
    //               user: true,
    //             },
    //           },
    //         },
    //       },
    //       splits: {
    //         include: {
    //           member: {
    //             include: {
    //               user: true,
    //             },
    //           },
    //         },
    //       },
    //     },
    //   });
    // });
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

  async analyzeText(
    analyzeTextDto: AnalyzeTextDto,
    user: UserEntity,
    timezoneOffset: number,
  ): Promise<AiExpenseTemplateDto> {
    const { groupId, text } = analyzeTextDto;

    const { context, members, categories, group, currentMember } =
      await this.getContextToAnalize(groupId, user);

    if (timezoneOffset) {
      context.timezoneOffset = timezoneOffset;
    }

    // Analyze with AI
    const rawData = await this.aiService.analyzeText(text, context);

    // Map and return
    return this.mapRawDataToTemplate({
      rawData,
      members,
      categories,
      currentMember,
      group,
      timezoneOffset,
    });
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
    timezoneOffset,
  }: {
    rawData: RawAiExpenseData;
    members: Array<MemberEntity>;
    categories: Array<{ id: string; name: string }>;
    currentMember: MemberEntity;
    group: GroupEntity;
    timezoneOffset?: number;
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

    const splits = members.map((m) => {
      let amount = 0;

      if (group.splitType === SplitType.EQUAL) {
        amount = totalAmount / members.length;
      } else {
        amount = m.defaultSplit ? totalAmount * (m.defaultSplit / 100) : 0;
      }

      amount = Math.round(amount * 100) / 100; // Round to 2 decimal places

      return {
        memberId: m.id,
        amount,
        memberName: m.user.name,
      };
    });

    const date = rawData.date
      ? new Date(
          new Date(rawData.date).getTime() +
            (timezoneOffset ?? 0) * 60 * 60 * 1000,
        )
      : new Date();

    return {
      title: rawData.title,
      date: date.toISOString(),
      description: rawData.description || "",
      categoryAmounts,
      payments,
      splits,
    };
  }
}
