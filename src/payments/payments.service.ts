import { Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { DatabaseService } from "../config/database/database.service";
import { Prisma } from "../../prisma/generated/client";

@Injectable()
export class PaymentsService {
  constructor(private readonly db: DatabaseService) {}

  create(createPaymentDto: CreatePaymentDto, tx?: Prisma.TransactionClient) {
    const client = tx || this.db;
    return client.payment.create({
      data: createPaymentDto,
    });
  }

  findAll() {
    return this.db.payment.findMany();
  }

  findOne(id: string) {
    return this.db.payment.findUnique({
      where: { id },
    });
  }

  update(id: string, updatePaymentDto: UpdatePaymentDto) {
    return this.db.payment.update({
      where: { id },
      data: updatePaymentDto,
    });
  }

  remove(id: string) {
    return this.db.payment.delete({
      where: { id },
    });
  }
}
