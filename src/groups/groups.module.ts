import { Module } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { GroupsController } from "./groups.controller";
import { CategoriesModule } from "src/categories/categories.module";
import { MembersModule } from "src/members/members.module";

@Module({
  controllers: [GroupsController],
  providers: [GroupsService],
  imports: [CategoriesModule, MembersModule],
})
export class GroupsModule {}
