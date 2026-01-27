import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { DatabaseService } from "../config/database/database.service";
import { UserEntity } from "src/users/entities/user.entity";
import { AiContext } from "src/ai/dto/ai-context.dto";
import { AiExpenseTemplateDto } from "./dto/ai-expense-template.dto";
import { MemberState, SplitType } from "prisma/generated/enums";
import { CategoryState } from "prisma/generated/enums";
import { AiService } from "src/ai/providers/ai.service";
import { RawAiExpenseData } from "src/ai/dto/raw-ai-expense-data.dto";
import { MemberEntity } from "src/members/entities/member.entity";
import { GroupEntity } from "src/groups/entities/group.entity";
import { AnalyzeTextDto } from "./dto/analyze-text.dto";

@Injectable()
export class AIAnalysisService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(AiService)
    private readonly aiService: AiService,
  ) {}

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
