import { Injectable } from "@nestjs/common";
import { DatabaseService } from "src/config/database/database.service";
import { TransactionClient } from "prisma/generated/internal/prismaNamespace";
import { CreateExpenseDto } from "./dto/create-expense.dto";

@Injectable()
export class ExpensesService {
  constructor(private readonly db: DatabaseService) {}

  async create(createExpenseDto: CreateExpenseDto, tx: TransactionClient) {
    return tx.expense.create({
      data: createExpenseDto,
    });
  }
}
