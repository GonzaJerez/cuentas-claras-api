import { Module } from "@nestjs/common";
import { ExpensesService } from "./expenses.service";
import { ExpensesController } from "./expenses.controller";
import { SplitsService } from "./splits/splits.service";
import { PaymentsService } from "./payments/payments.service";

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, PaymentsService, SplitsService],
})
export class ExpensesModule {}
