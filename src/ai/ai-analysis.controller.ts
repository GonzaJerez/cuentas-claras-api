import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  FileTypeValidator,
  ParseFilePipe,
  BadRequestException,
  Headers,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { UserEntity } from "src/users/entities/user.entity";
import { StandardResponse } from "src/shared/dto/responses.dto";
import { AnalyzeAudioDto } from "./dto/analyze-audio.dto";
import { AnalyzeImagesDto } from "./dto/analyze-images.dto";
import { AnalyzeTextDto } from "./dto/analyze-text.dto";
import { AiExpenseTemplateDto } from "./dto/ai-expense-template.dto";
import { AIAnalysisService } from "./ai-analysis.service";

@Controller("ai")
export class AiController {
  constructor(private readonly aiAnalysisService: AIAnalysisService) {}

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

    const result = this.aiAnalysisService.analyzeAudio(
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

    const result = this.aiAnalysisService.analyzeImages(
      files,
      analyzeImagesDto.groupId,
      user,
    );

    return StandardResponse.basic("Images analyzed successfully", result);
  }

  @Post("text")
  @Auth()
  async analyzeText(
    @Body() analyzeTextDto: AnalyzeTextDto,
    @GetUser() user: UserEntity,
    @Headers("x-timezone-offset") timezoneOffset: number,
  ): Promise<StandardResponse<AiExpenseTemplateDto>> {
    if (!analyzeTextDto.text || analyzeTextDto.text.trim().length === 0) {
      throw new BadRequestException(
        "El campo 'text' es requerido y no puede estar vacío.",
      );
    }

    return StandardResponse.basic(
      "Text analyzed successfully",
      this.aiAnalysisService.analyzeText(analyzeTextDto, user, timezoneOffset),
    );
  }
}
