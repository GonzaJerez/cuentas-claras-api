import { Controller, Body, Patch, Param } from "@nestjs/common";
import { MembersService } from "./members.service";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { UserEntity } from "src/users/entities/user.entity";

@Controller("members")
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Patch(":id")
  @Auth()
  update(
    @Param("id") id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @GetUser() user: UserEntity,
  ) {
    return this.membersService.update(id, updateMemberDto, user);
  }
}
