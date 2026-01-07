import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { ExpensesService } from "./expenses.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { UserEntity } from "src/users/entities/user.entity";
import { StandardResponse } from "src/shared/dto/responses.dto";
import { ExpenseResponse } from "./dto/responses/expense.response";

@Controller("expenses")
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Auth()
  create(
    @Body() createExpenseDto: CreateExpenseDto,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<ExpenseResponse>> {
    return StandardResponse.basic(
      "Expenses created successfully",
      this.expensesService.create(createExpenseDto, user),
    );
  }

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.expensesService.remove(id);
  }
}
