import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { DatabaseService } from "../config/database/database.service";
import { INITIAL_CATEGORIES } from "./constants/initial-categories";
import { TransactionClient } from "prisma/generated/internal/prismaNamespace";
import { CategoryResponse } from "./dto/responses/category.response";
import { CategoryState } from "prisma/generated/enums";
import { UserEntity } from "src/users/entities/user.entity";
import { MembersService } from "src/members/members.service";
import { CategoryEntity } from "./entities/category.entity";

@Injectable()
export class CategoriesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly membersService: MembersService,
  ) {}

  async createInitialCategories(groupId: string, tx: TransactionClient) {
    for (const category of INITIAL_CATEGORIES) {
      await tx.category.createMany({
        data: {
          groupId,
          name: category.name,
          icon: category.icon,
        },
      });
    }
  }

  async create(
    createCategoryDto: CreateCategoryDto,
    user: UserEntity,
  ): Promise<CategoryResponse> {
    await this.membersService.checkIsGroupAdmin(
      createCategoryDto.groupId,
      user,
    );

    const categoryCreated = await this.db.category.create({
      data: createCategoryDto,
    });

    return CategoryResponse.fromEntity(categoryCreated);
  }

  async findAll(
    groupId: string,
    user: UserEntity,
  ): Promise<CategoryResponse[]> {
    await this.membersService.checkIsAGroupMember(groupId, user);

    const categories = await this.db.category.findMany({
      where: { groupId, state: CategoryState.ACTIVE },
    });

    return categories.map(CategoryResponse.fromEntity);
  }

  private async findOne(id: string): Promise<CategoryEntity> {
    const category = await this.db.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    user: UserEntity,
  ): Promise<CategoryResponse> {
    if (
      Object.values(updateCategoryDto).every((value) => value === undefined)
    ) {
      throw new BadRequestException("No fields to update");
    }
    const category = await this.findOne(id);

    await this.membersService.checkIsGroupAdmin(category.groupId, user);

    const categoryUpdated = await this.db.category.update({
      where: { id },
      data: updateCategoryDto,
    });

    return CategoryResponse.fromEntity(categoryUpdated);
  }

  async remove(id: string, user: UserEntity): Promise<CategoryResponse> {
    const category = await this.findOne(id);

    await this.membersService.checkIsGroupAdmin(category.groupId, user);

    const categoryDeleted = await this.db.category.update({
      where: { id },
      data: {
        state: CategoryState.INACTIVE,
      },
    });

    return CategoryResponse.fromEntity(categoryDeleted);
  }
}
