import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { UserEntity } from "src/users/entities/user.entity";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { GroupsFiltersDto } from "./dto/filters.dto";
import { GroupDetailsResponse } from "./dto/responses/group-details.response";
import { ListGroupResponse } from "./dto/responses/list-group.response";
import { GroupResponse } from "./dto/responses/group.response";
import { JoinGroupDto } from "./dto/join-group.dto";
import { StandardResponse } from "src/shared/dto/responses.dto";
import { MemberResponse } from "src/members/dto/responses/member.response";

@Controller("groups")
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Auth()
  async create(
    @Body() createGroupDto: CreateGroupDto,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<GroupResponse>> {
    return StandardResponse.basic(
      "Group created successfully",
      this.groupsService.create(createGroupDto, user.id),
    );
  }

  @Get()
  @Auth()
  async findAll(
    @Query() filters: GroupsFiltersDto,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<ListGroupResponse[]>> {
    return StandardResponse.basic(
      "Groups fetched successfully",
      this.groupsService.findAll(filters, user),
    );
  }

  @Get(":id")
  @Auth()
  findOne(
    @Param("id") id: string,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<GroupDetailsResponse>> {
    return StandardResponse.basic(
      "Group fetched successfully",
      this.groupsService.findOne(id, user),
    );
  }

  @Patch(":id")
  @Auth()
  update(
    @Param("id") id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @GetUser() user: UserEntity,
  ) {
    return this.groupsService.update(id, updateGroupDto, user);
  }

  @Get("/join/:code")
  @Auth()
  validateCodeToJoin(
    @Param("code") code: string,
    @GetUser() user: UserEntity,
  ): Promise<GroupResponse> {
    return this.groupsService.getGroupByCode(code, user);
  }

  @Post("/join")
  @Auth()
  join(
    @Body() joinGroupDto: JoinGroupDto,
    @GetUser() user: UserEntity,
  ): Promise<MemberResponse> {
    return this.groupsService.join(joinGroupDto, user);
  }
}
