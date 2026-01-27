import { Module } from "@nestjs/common";
import { MovementsService } from "./movements.service";
import { MovementsController } from "./movements.controller";
import { SplitsService } from "./splits/splits.service";
import { PaymentsService } from "./payments/payments.service";
import { AmountByCategoryService } from "./amounts-by-categories/amount-by-category.service";

@Module({
  imports: [],
  controllers: [MovementsController],
  providers: [
    MovementsService,
    AmountByCategoryService,
    PaymentsService,
    SplitsService,
  ],
})
export class MovementsModule {}
