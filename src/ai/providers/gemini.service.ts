import { Injectable } from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";
import { IProviderService } from "../interfaces/ia-analysis.service";
import { env } from "src/config/envs/env.config";

@Injectable()
export class GeminiService implements IProviderService {
  private readonly ai: GoogleGenAI;
  private readonly model = "gemini-2.5-flash";

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: env!.GEMINI_API_KEY,
    });
  }

  async analyzeAudio(
    file: Buffer,
    mimeType: string,
    prompt: string,
  ): Promise<string> {
    const base64File = file.toString("base64");

    const contents = [
      {
        inlineData: {
          mimeType,
          data: base64File,
        },
      },
      { text: prompt },
    ];

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents,
    });

    const text = response.text;
    if (!text) {
      throw new Error("AI response is empty");
    }
    return text;
  }

  async analyzeImages(
    images: Array<{ buffer: Buffer; mimeType: string }>,
    prompt: string,
  ): Promise<string> {
    const contents = [
      ...images.map((image) => ({
        inlineData: {
          mimeType: image.mimeType,
          data: image.buffer.toString("base64"),
        },
      })),
      { text: prompt },
    ];

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents,
    });

    const text = response.text;
    if (!text) {
      throw new Error("AI response is empty");
    }
    return text;
  }
}
