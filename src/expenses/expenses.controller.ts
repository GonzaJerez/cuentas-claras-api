import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  FileTypeValidator,
  ParseFilePipe,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ExpensesService } from "./expenses.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { UserEntity } from "src/users/entities/user.entity";
import { StandardResponse } from "src/shared/dto/responses.dto";
import { ExpenseResponse } from "./dto/responses/expense.response";
import { AnalyzeAudioDto } from "./dto/analyze-audio.dto";
import { AnalyzeImagesDto } from "./dto/analyze-images.dto";
import { AiExpenseTemplateDto } from "./dto/ai-expense-template.dto";

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

  @Post("audio")
  @Auth()
  @UseInterceptors(FileInterceptor("file"))
  async analyzeAudio(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: "audio/*" })],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
    @Body() analyzeAudioDto: AnalyzeAudioDto,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<AiExpenseTemplateDto>> {
    // If file is not provided, let client know which field is expected
    if (!file) {
      throw new BadRequestException(
        "No file uploaded. Please use 'file' field when uploading a file.",
      );
    }

    const result = this.expensesService.analyzeAudio(
      file,
      analyzeAudioDto.groupId,
      user,
    );

    return StandardResponse.basic("Audio analyzed successfully", result);
  }

  @Post("images")
  @Auth()
  @UseInterceptors(FilesInterceptor("images", 10))
  async analyzeImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: "image/*" })],
        fileIsRequired: false,
      }),
    )
    files: Express.Multer.File[],
    @Body() analyzeImagesDto: AnalyzeImagesDto,
    @GetUser() user: UserEntity,
  ): Promise<StandardResponse<AiExpenseTemplateDto>> {
    // If files array is empty, let client know which field is expected
    if (!files || files.length === 0) {
      throw new BadRequestException(
        "No files uploaded. Please use 'images' field when uploading files.",
      );
    }

    const result = this.expensesService.analyzeImages(
      files,
      analyzeImagesDto.groupId,
      user,
    );

    return StandardResponse.basic("Images analyzed successfully", result);
  }
}
