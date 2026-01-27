import { Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { TransactionClient } from "prisma/generated/internal/prismaNamespace";

@Injectable()
export class PaymentsService {
  constructor() {}

  async create(
    movementId: string,
    createPaymentDto: CreatePaymentDto,
    tx: TransactionClient,
  ) {
    return tx.payment.create({
      data: { ...createPaymentDto, movementId },
    });
  }
}
