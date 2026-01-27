import { Module } from "@nestjs/common";
import { GeminiService } from "./providers/gemini.service";
import { AiService } from "./providers/ai.service";
import { AIAnalysisService } from "./ai-analysis.service";

@Module({
  providers: [GeminiService, AiService, AIAnalysisService],
  // exports: [AiService],
})
export class AIModule {}
