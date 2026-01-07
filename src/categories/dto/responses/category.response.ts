import { CategoryEntity } from "src/categories/entities/category.entity";

export class CategoryResponse {
  id: string;
  name: string;
  icon: string;

  static fromEntity(entity: CategoryEntity): CategoryResponse {
    return {
      id: entity.id,
      name: entity.name,
      icon: entity.icon,
    };
  }
}
