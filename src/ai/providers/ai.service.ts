import { Inject, Injectable } from "@nestjs/common";
import { GeminiService } from "./gemini.service";
import { IProviderService } from "../interfaces/ia-analysis.service";
import { RawAiExpenseData } from "../dto/raw-ai-expense-data.dto";
import { AiContext } from "../dto/ai-context.dto";

@Injectable()
export class AiService {
  constructor(
    @Inject(GeminiService)
    private readonly aiProvider: IProviderService,
  ) {}

  async analyzeAudio(
    file: Buffer,
    mimeType: string,
    context: AiContext,
  ): Promise<RawAiExpenseData> {
    const prompt = this.buildAudioPrompt(context);
    const response = await this.aiProvider.analyzeAudio(file, mimeType, prompt);
    return this.parseResponse(response);
  }

  async analyzeImages(
    images: Array<{ buffer: Buffer; mimeType: string }>,
    context: AiContext,
  ): Promise<RawAiExpenseData> {
    const prompt = this.buildImagesPrompt(context);
    const aiAnalysis = await this.aiProvider.analyzeImages(images, prompt);
    console.dir({ aiAnalysis }, { depth: null });
    return this.parseResponse(aiAnalysis);
  }

  private buildAudioPrompt(context: AiContext): string {
    const membersList = context.memberNames.join(", ");
    const categoriesList = context.categories
      .map((cat) => `${cat.name} (id: ${cat.id})`)
      .join(", ");

    const prompt = `You are analyzing a receipt/ticket to extract expense information. 

Available group members: ${membersList}

Available categories: ${categoriesList}

Extract the following information and return ONLY valid JSON (no additional text):

{
  "title": "Descriptive title of the expense in spanish (e.g., 'Almuerzo en restaurante', 'Compra en supermercado')",
  "date": "Date if visible in the receipt (ISO string format, e.g., '2024-01-15T12:00:00Z') or null",
  "description": "Additional description if relevant information is available, or empty string",
  "detectedCategoryAmounts": [
    {
      "categoryName": "Category name that best matches (must match one of the available categories)",
      "amount": 50.00,
      "items": "Items purchased string separated by commas (e.g., 'Hamburguesa, Coca-Cola, Helado') or null"
    }
  ],
  "detectedPayments": [
    {
      "memberName": "Name of person who paid (should match one of the available members if possible)",
      "amount": 50.00
    }
  ],
  "detectedSplits": [
    {
      "memberName": "Name of person who should pay (should match one of the available members)",
      "amount": 25.00
    }
  ]
}

IMPORTANT NOTES:
- A receipt can have multiple categories. Identify different types of products/services and group them by category.
- Example: If the receipt has "Food: $50" and "Drinks: $20", return two objects in detectedCategoryAmounts array.
- If the receipt doesn't have specific categories, group everything in a single category (use the most appropriate category from the available list).
- Each categoryName must match one of the available categories.
- The sum of all amounts in detectedCategoryAmounts is the total expense amount.
- If not specified detectedPayments, should return an empty array.
- If amount is not specified in detectedSplits, should return an empty array.
- Return ONLY the JSON object, no markdown, no code blocks, no additional text.`;

    return prompt;
  }

  private buildImagesPrompt(context: AiContext): string {
    const membersList = context.memberNames.join(", ");
    const categoriesList = context.categories
      .map((cat) => `${cat.name} (id: ${cat.id})`)
      .join(", ");

    const prompt = `You are analyzing a receipt/ticket to extract expense information. 

Available group members: ${membersList}

Available categories: ${categoriesList}

IMPORTANT: The provided images are from the same receipt/ticket. Analyze all images together and consolidate the information. If a product appears in multiple images, count its price only once. Sum all amounts from all images to get the total.

Extract the following information and return ONLY valid JSON (no additional text):

{
  "title": "Descriptive title of the expense in spanish (e.g., 'Almuerzo en restaurante', 'Compra en supermercado')",
  "date": "Date if visible in the receipt (ISO string format, e.g., '2024-01-15T12:00:00Z') or null",
  "description": "Additional description if relevant information is available, or empty string",
  "detectedCategoryAmounts": [
    {
      "categoryName": "Category name that best matches (must match one of the available categories)",
      "amount": 50.00,
      "items": "Items purchased string separated by commas (e.g., 'Hamburguesa, Coca-Cola, Helado') or null"
    }
  ]
}

IMPORTANT NOTES:
- A receipt can have multiple categories. Identify different types of products/services and group them by category.
- Example: If the receipt has "Food: $50" and "Drinks: $20", return two objects in detectedCategoryAmounts array.
- If the receipt doesn't have specific categories, group everything in a single category (use the most appropriate category from the available list).
- Each categoryName must match one of the available categories.
- The sum of all amounts in detectedCategoryAmounts is the total expense amount.
- Return ONLY the JSON object, no markdown, no code blocks, no additional text.`;

    return prompt;
  }

  private parseResponse(text: string): RawAiExpenseData {
    // Remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
      return JSON.parse(cleanedText) as RawAiExpenseData;
    } catch (error) {
      throw new Error(
        `Failed to parse AI response as JSON: ${error.message}. Response: ${text}`,
      );
    }
  }
}
