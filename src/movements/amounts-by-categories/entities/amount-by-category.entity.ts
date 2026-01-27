import { AmountByCategory } from "prisma/generated/client";
import { CategoryEntity } from "src/categories/entities/category.entity";
import { MovementEntity } from "src/movements/entities/movement.entity";

export class AmountByCategoryEntity implements AmountByCategory {
  id: string;
  amount: number;
  description: string | null;
  movementId: string;
  categoryId: string;

  movement?: MovementEntity;
  category: CategoryEntity;
}
