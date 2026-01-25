import { MovementMinimalResponse } from "src/movements/dto/responses/movement-minimal.response";
import { GroupResponse } from "./group.response";

export class GroupDetailsResponse extends GroupResponse {
  lastExpenses: MovementMinimalResponse[];
  userBalance: number;
}
