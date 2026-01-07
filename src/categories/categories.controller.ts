import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { UserEntity } from "src/users/entities/user.entity";
import { StandardResponse } from "src/shared/dto/responses.dto";
import { CategoryResponse } from "./dto/responses/category.response";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Auth()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<CategoryResponse>> {
    return StandardResponse.basic(
      "Category created successfully",
      this.categoriesService.create(createCategoryDto, user),
    );
  }

  @Get(":groupId")
  @Auth()
  findAll(
    @Param("groupId") groupId: string,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<CategoryResponse[]>> {
    return StandardResponse.basic(
      "Categories fetched successfully",
      this.categoriesService.findAll(groupId, user),
    );
  }

  @Patch(":id")
  @Auth()
  update(
    @Param("id") id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<CategoryResponse>> {
    return StandardResponse.basic(
      "Category updated successfully",
      this.categoriesService.update(id, updateCategoryDto, user),
    );
  }

  @Delete(":id")
  @Auth()
  remove(
    @Param("id") id: string,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<CategoryResponse>> {
    return StandardResponse.basic(
      "Category removed successfully",
      this.categoriesService.remove(id, user),
    );
  }
}
