import { Injectable } from "@nestjs/common";
import { CreateSplitDto } from "./dto/create-split.dto";
import { UpdateSplitDto } from "./dto/update-split.dto";
import { DatabaseService } from "../config/database/database.service";
import { Prisma } from "../../prisma/generated/client";

@Injectable()
export class SplitsService {
  constructor(private readonly db: DatabaseService) {}

  create(createSplitDto: CreateSplitDto, tx?: Prisma.TransactionClient) {
    const client = tx || this.db;
    return client.split.create({
      data: createSplitDto,
    });
  }

  findAll() {
    return this.db.split.findMany();
  }

  findOne(id: string) {
    return this.db.split.findUnique({
      where: { id },
    });
  }

  update(id: string, updateSplitDto: UpdateSplitDto) {
    return this.db.split.update({
      where: { id },
      data: updateSplitDto,
    });
  }

  remove(id: string) {
    return this.db.split.delete({
      where: { id },
    });
  }
}
