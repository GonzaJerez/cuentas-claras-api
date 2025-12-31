import { IsOptional, IsUUID } from "class-validator";
import { PaginationDto } from "src/shared/dto/pagination.dto";

export class GroupsFiltersDto extends PaginationDto {
  @IsUUID()
  @IsOptional()
  userId?: string;
}
