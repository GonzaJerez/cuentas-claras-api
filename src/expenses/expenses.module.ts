import { Module } from "@nestjs/common";
import { ExpensesService } from "./expenses.service";
import { ExpensesController } from "./expenses.controller";
import { SplitsService } from "./splits/splits.service";
import { PaymentsService } from "./payments/payments.service";
import { AIModule } from "src/ai/ai.module";

@Module({
  imports: [AIModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, PaymentsService, SplitsService],
})
export class ExpensesModule {}
