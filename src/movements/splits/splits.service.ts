import { Injectable } from "@nestjs/common";
import { CreateSplitDto } from "./dto/create-split.dto";
import { TransactionClient } from "prisma/generated/internal/prismaNamespace";

@Injectable()
export class SplitsService {
  constructor() {}

  async create(
    movementId: string,
    createSplitDto: CreateSplitDto,
    tx: TransactionClient,
  ) {
    return tx.split.create({
      data: { ...createSplitDto, movementId },
    });
  }
}
