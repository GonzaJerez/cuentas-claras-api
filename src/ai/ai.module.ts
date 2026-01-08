import { Module } from "@nestjs/common";
import { GeminiService } from "./providers/gemini.service";
import { AiService } from "./providers/ai.service";

@Module({
  providers: [GeminiService, AiService],
  exports: [AiService],
})
export class AIModule {}
