import { Injectable } from "@nestjs/common";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { DatabaseService } from "../config/database/database.service";

@Injectable()
export class CategoriesService {
  constructor(private readonly db: DatabaseService) {}

  create(createCategoryDto: CreateCategoryDto) {
    return this.db.category.create({
      data: createCategoryDto,
    });
  }

  findAll() {
    return this.db.category.findMany();
  }

  findOne(id: string) {
    return this.db.category.findUnique({
      where: { id },
    });
  }

  update(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.db.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  remove(id: string) {
    return this.db.category.delete({
      where: { id },
    });
  }
}
