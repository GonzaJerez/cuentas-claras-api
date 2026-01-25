import { PartialType } from "@nestjs/mapped-types";
import { CreateMovementExpenseDto } from "./create-movement-expense.dto";

export class UpdateExpenseDto extends PartialType(CreateMovementExpenseDto) {}
