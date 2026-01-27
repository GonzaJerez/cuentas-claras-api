import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from "@nestjs/common";
import { MovementsService } from "./movements.service";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { UserEntity } from "src/users/entities/user.entity";
import { StandardResponse } from "src/shared/dto/responses.dto";
import { MovementMinimalResponse } from "./dto/responses/movement-minimal.response";
import { MovementDetailResponse } from "./dto/responses/movement-detail.response";
import { UpdateMovementDto } from "src/movements/dto/update-movement.dto";
import { CreateMovementDto } from "./dto/create-movement.dto";

@Controller("movements")
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post()
  @Auth()
  create(
    @Body() createMovementDto: CreateMovementDto,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<MovementDetailResponse>> {
    return StandardResponse.basic(
      "Movement created successfully",
      this.movementsService.create(createMovementDto, user),
    );
  }

  @Get()
  findAll(): Promise<StandardResponse<MovementMinimalResponse[]>> {
    return StandardResponse.basic(
      "Movements fetched successfully",
      this.movementsService.findAll(),
    );
  }

  @Get(":id")
  @Auth()
  findOne(
    @Param("id") id: string,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<MovementDetailResponse>> {
    return StandardResponse.basic(
      "Movement found successfully",
      this.movementsService.findOne(id, user),
    );
  }

  @Put(":id")
  @Auth()
  update(
    @Param("id") id: string,
    @Body() updateMovementDto: UpdateMovementDto,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<MovementDetailResponse>> {
    return StandardResponse.basic(
      "Movement updated successfully",
      this.movementsService.update(id, updateMovementDto, user),
    );
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.movementsService.remove(id);
  }
}
