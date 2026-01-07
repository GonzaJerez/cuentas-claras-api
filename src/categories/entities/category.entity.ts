import { Category, CategoryState } from "../../../prisma/generated/client";

export class CategoryEntity implements Category {
  id: string;
  groupId: string;
  name: string;
  icon: string;
  state: CategoryState;
}
