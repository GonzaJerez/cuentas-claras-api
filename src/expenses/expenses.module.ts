import { Module } from "@nestjs/common";
import { ExpensesService } from "./expenses.service";
import { ExpensesController } from "./expenses.controller";
import { PaymentsModule } from "../payments/payments.module";
import { SplitsModule } from "../splits/splits.module";

@Module({
  imports: [PaymentsModule, SplitsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
