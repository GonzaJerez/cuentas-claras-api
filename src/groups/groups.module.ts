import { Module } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { GroupsController } from "./groups.controller";
import { CategoriesModule } from "src/categories/categories.module";

@Module({
  controllers: [GroupsController],
  providers: [GroupsService],
  imports: [CategoriesModule],
})
export class GroupsModule {}
