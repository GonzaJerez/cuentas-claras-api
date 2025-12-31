import { Injectable } from "@nestjs/common";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { DatabaseService } from "../config/database/database.service";
import { PaymentsService } from "../payments/payments.service";
import { SplitsService } from "../splits/splits.service";

@Injectable()
export class ExpensesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly paymentsService: PaymentsService,
    private readonly splitsService: SplitsService,
  ) {}

  async create(createExpenseDto: CreateExpenseDto) {
    const { payments, splits, ...expenseData } = createExpenseDto;

    return this.db.$transaction(async (tx) => {
      // Create Expense
      const expense = await tx.expense.create({
        data: expenseData,
      });

      // Create Payments
      for (const payment of payments) {
        await this.paymentsService.create(
          {
            ...payment,
            expenseId: expense.id,
          },
          tx,
        );
      }

      // Create Splits
      for (const split of splits) {
        await this.splitsService.create(
          {
            ...split,
            expenseId: expense.id,
          },
          tx,
        );
      }

      return expense;
    });
  }

  findAll() {
    return this.db.expense.findMany({
      include: {
        payments: true,
        splits: true,
      },
    });
  }

  findOne(id: string) {
    return this.db.expense.findUnique({
      where: { id },
      include: {
        payments: true,
        splits: true,
      },
    });
  }

  update(id: string, updateExpenseDto: UpdateExpenseDto) {
    // Handling update with payments/splits is complex (delete/recreate or update diff).
    // For now simple update of expense fields.
    // If payments/splits are included, implementing full sync logic would be better.
    // User requested "payments and splits unicamente se van a crear cuando se cree un expense, y tambien se van a poder editar cuando se edite un expense".

    // Simplest approach: Delete existing related records and recreate if provided in DTO.
    // Or just update expense fields if no payments/splits provided.

    const { payments, splits, ...expenseData } = updateExpenseDto;

    return this.db.$transaction(async (tx) => {
      const expense = await tx.expense.update({
        where: { id },
        data: expenseData,
      });

      if (payments) {
        // This assumes replacing all payments.
        // Real world app might want smarter updates.
        // But for "CRUD necessary", this works.
        // Wait, payments module has delete logic exposed via service but tx?
        // PaymentsService.remove doesn't accept tx. I should add it or use tx.payment.deleteMany.
        await tx.payment.deleteMany({ where: { expenseId: id } });
        for (const payment of payments) {
          await this.paymentsService.create({ ...payment, expenseId: id }, tx);
        }
      }

      if (splits) {
        await tx.split.deleteMany({ where: { expenseId: id } });
        for (const split of splits) {
          await this.splitsService.create({ ...split, expenseId: id }, tx);
        }
      }

      return expense;
    });
  }

  remove(id: string) {
    return this.db.expense.delete({
      where: { id },
    });
  }
}
