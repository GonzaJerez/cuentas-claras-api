import { Injectable } from "@nestjs/common";
import { TransactionClient } from "prisma/generated/internal/prismaNamespace";
import { CreateAmountByCategoryDto } from "./dto/create-amount-by-category.dto";

@Injectable()
export class AmountByCategoryService {
  constructor() {}

  create(
    movementId: string,
    createExpenseDto: CreateAmountByCategoryDto,
    tx: TransactionClient,
  ) {
    return tx.amountByCategory.create({
      data: { ...createExpenseDto, movementId },
    });
  }
}
