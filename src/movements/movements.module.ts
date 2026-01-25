import { Module } from "@nestjs/common";
import { MovementsService } from "./movements.service";
import { MovementsController } from "./movements.controller";
import { SplitsService } from "./splits/splits.service";
import { PaymentsService } from "./payments/payments.service";
import { AIModule } from "src/ai/ai.module";
import { TransfersService } from "./transfers/transfers.service";
import { ExpensesService } from "./expenses/expenses.service";

@Module({
  imports: [AIModule],
  controllers: [MovementsController],
  providers: [
    MovementsService,
    ExpensesService,
    PaymentsService,
    SplitsService,
    TransfersService,
  ],
})
export class MovementsModule {}
