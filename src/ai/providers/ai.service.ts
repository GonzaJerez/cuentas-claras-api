import { BadRequestException, Inject, Injectable } from "@nestjs/common";
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
    const prompt = this.buildTextPrompt(context);
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

  async analyzeText(
    text: string,
    context: AiContext,
  ): Promise<RawAiExpenseData> {
    const prompt = this.buildTextPrompt(context);
    const response = await this.aiProvider.analyzeText(text, prompt);
    return this.parseResponse(response);
  }

  //   private buildAudioPrompt(context: AiContext): string {
  //     const membersList = context.memberNames.join(", ");
  //     const categoriesList = context.categories
  //       .map((cat) => `${cat.name} (id: ${cat.id})`)
  //       .join(", ");

  //     const prompt = `You are analyzing a receipt/ticket to extract expense information.

  // Available group members: ${membersList}

  // Available categories: ${categoriesList}

  // Extract the following information and return ONLY valid JSON (no additional text):

  // {
  //   "title": "Descriptive title of the expense in spanish (e.g., 'Almuerzo en restaurante', 'Compra en supermercado')",
  //   "date": "Date if visible in the receipt (ISO string format, e.g., '2024-01-15T12:00:00Z') or null",
  //   "description": "Additional description if relevant information is available, or empty string",
  //   "detectedCategoryAmounts": [
  //     {
  //       "categoryName": "Category name that best matches (must match one of the available categories)",
  //       "amount": 50.00,
  //       "items": "General description of items purchased, grouping similar items together. Use broad categories instead of specific details (e.g., if there are 5 different types of pasta, return 'fideos' instead of listing each type; if there are multiple cookie varieties, return 'galletitas'). Return a comma-separated string with general categories (e.g., 'fideos, galletitas, bebidas') or null"
  //     }
  //   ],
  //   "detectedPayments": [
  //     {
  //       "memberName": "Name of person who paid (should match one of the available members if possible)",
  //       "amount": 50.00
  //     }
  //   ],
  //   "detectedSplits": [
  //     {
  //       "memberName": "Name of person who should pay (should match one of the available members)",
  //       "amount": 25.00
  //     }
  //   ]
  // }

  // IMPORTANT NOTES:
  // - A receipt can have multiple categories. Identify different types of products/services and group them by category.
  // - Example: If the receipt has "Food: $50" and "Drinks: $20", return two objects in detectedCategoryAmounts array.
  // - If the receipt doesn't have specific categories, group everything in a single category (use the most appropriate category from the available list).
  // - Each categoryName must match one of the available categories.
  // - The sum of all amounts in detectedCategoryAmounts is the total expense amount.
  // - For the "items" field: Group similar items together and use general categories. For example, if there are 5 different types of pasta (spaghetti, penne, fusilli, etc.), return only "fideos". If there are multiple cookie varieties, return only "galletitas". The goal is to provide a general overview, not detailed itemization.
  // - If not specified detectedPayments, should return an empty array.
  // - If amount is not specified in detectedSplits, should return an empty array.
  // - Return ONLY the JSON object, no markdown, no code blocks, no additional text.`;

  //     return prompt;
  //   }

  private buildImagesPrompt(context: AiContext): string {
    const prompt = `You are analyzing a receipt/ticket to extract expense information. 

    ${this.analysisOutputContext(context)}

    IMPORTANT NOTES:
    - A receipt can have multiple categories. Identify different types of products/services and group them by category.
    - Example: If the receipt has "Food: $50" and "Drinks: $20", return two objects in detectedCategoryAmounts array.
    - If the receipt doesn't have specific categories, group everything in a single category (use the most appropriate category from the available list).
    - Each categoryName must match one of the available categories.
    - The sum of all amounts in detectedCategoryAmounts is the total expense amount.
    - For the "items" field: Group similar items together and use general categories. For example, if there are 5 different types of pasta (spaghetti, penne, fusilli, etc.), return only "fideos". If there are multiple cookie varieties, return only "galletitas". The goal is to provide a general overview, not detailed itemization.
    - CRITICAL: If the image quality is poor, text is blurry, unreadable, or you cannot confidently extract the required information (especially amounts or category names), you MUST return a JSON object with ONLY this structure: {"error": "unreadable", "message": "No se pudo leer correctamente la información del recibo. Por favor, sube imágenes más claras."}
    - Do NOT guess or make up values if you cannot read them clearly. If you are uncertain about any critical information, return the error structure above.
    - Return ONLY the JSON object, no markdown, no code blocks, no additional text.`;

    return prompt;
  }

  private buildTextPrompt(context: AiContext): string {
    const prompt = `You are analyzing a expense description to extract information.

    ${this.analysisOutputContext(context)}

    IMPORTANT NOTES:
    - A expense can have multiple categories. Identify different types of products/services and group them by category.
    - Example: If the expense has "Food: $50" and "Drinks: $20", return two objects in detectedCategoryAmounts array.
    - If the expense doesn't have specific categories, group everything in a single category (use the most appropriate category from the available list).
    - Each categoryName must match one of the available categories.
    - The sum of all amounts in detectedCategoryAmounts is the total expense amount.
    - For the "items" field: Group similar items together and use general categories. For example, if there are 5 different types of pasta (spaghetti, penne, fusilli, etc.), return only "fideos". If there are multiple cookie varieties, return only "galletitas". The goal is to provide a general overview, not detailed itemization.
    - If not specified detectedPayments, should return an empty array.
    - If amount is not specified in detectedSplits, should return an empty array.
    - Return ONLY the JSON object, no markdown, no code blocks, no additional text.`;

    return prompt;
  }

  private analysisOutputContext(context: AiContext): string {
    const membersList = context.memberNames.join(", ");
    const categoriesList = context.categories
      .map((cat) => `${cat.name} (id: ${cat.id})`)
      .join(", ");
    const todayDate = new Date(
      Date.now() + (context.timezoneOffset ?? 0) * 60 * 60 * 1000,
    );

    return `
    Available group members: ${membersList}

    Available categories: ${categoriesList}

    The execution date of today is ${todayDate.toISOString()}.

    Extract the following information and return ONLY valid JSON (no additional text):

    {
      "title": "Descriptive title of the expense in spanish (e.g., 'Almuerzo en restaurante', 'Compra en supermercado')",
      "date": "Date of the expense, if available. The date may appear in various formats such as dd/mm, dd/mm/yy, dd/mm/yyyy, or as a description relative to today like 'ayer', 'el domingo pasado', etc. You must interpret these formats and return the correct ISO string date (e.g., '2024-01-15T12:00:00Z'). If the date cannot be determined, return null.",
      "description": "Additional description if relevant information is available, or empty string",
      "detectedCategoryAmounts": [
        {
          "categoryName": "Category name that best matches (must match one of the available categories)",
          "amount": 50.00,
          "items": "General description of items purchased, grouping similar items together. Use broad categories instead of specific details (e.g., if there are 5 different types of pasta, return 'fideos' instead of listing each type; if there are multiple cookie varieties, return 'galletitas'). Return a comma-separated string with general categories (e.g., 'fideos, galletitas, bebidas') or null"
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
    }`;
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
      const parsed = JSON.parse(cleanedText) as
        | RawAiExpenseData
        | { error: string; message?: string };

      // Check if AI returned an error indicating unreadable content
      if ("error" in parsed && parsed.error === "unreadable") {
        throw new BadRequestException(
          parsed.message ||
            "No se pudo leer correctamente la información del recibo. Por favor, sube imágenes más claras.",
        );
      }

      // Validate that we have the required data
      this.validateParsedData(parsed);

      return parsed as RawAiExpenseData;
    } catch (error) {
      // If it's already a BadRequestException, re-throw it
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(
        `Failed to parse AI response as JSON: ${error.message}. Response: ${text}`,
      );
    }
  }

  private validateParsedData(data: any): void {
    // Check if detectedCategoryAmounts exists and has valid data
    if (
      !data.detectedCategoryAmounts ||
      !Array.isArray(data.detectedCategoryAmounts) ||
      data.detectedCategoryAmounts.length === 0
    ) {
      throw new BadRequestException(
        "No se pudo leer correctamente la información del recibo. Por favor, sube imágenes más claras.",
      );
    }

    // Check for suspicious values that indicate uncertainty
    const uncertaintyIndicators = [
      "unknown",
      "desconocido",
      "?",
      "n/a",
      "na",
      "no disponible",
      "no se puede leer",
      "ilegible",
      "unclear",
      "indistinto",
    ];

    // Validate each category amount
    for (const category of data.detectedCategoryAmounts) {
      // Check if categoryName is missing or contains uncertainty indicators
      if (
        !category.categoryName ||
        typeof category.categoryName !== "string" ||
        uncertaintyIndicators.some((indicator) =>
          category.categoryName.toLowerCase().includes(indicator.toLowerCase()),
        )
      ) {
        throw new BadRequestException(
          "No se pudo leer correctamente la información del recibo. Por favor, sube imágenes más claras.",
        );
      }

      // Check if amount is missing, invalid, or zero (which might indicate uncertainty)
      if (
        category.amount === null ||
        category.amount === undefined ||
        typeof category.amount !== "number" ||
        isNaN(category.amount) ||
        category.amount <= 0
      ) {
        throw new BadRequestException(
          "No se pudo leer correctamente la información del recibo. Por favor, sube imágenes más claras.",
        );
      }
    }

    // Validate title exists and is not an uncertainty indicator
    if (
      !data.title ||
      typeof data.title !== "string" ||
      data.title.trim().length === 0 ||
      uncertaintyIndicators.some((indicator) =>
        data.title.toLowerCase().includes(indicator.toLowerCase()),
      )
    ) {
      throw new BadRequestException(
        "No se pudo leer correctamente la información del recibo. Por favor, sube imágenes más claras.",
      );
    }
  }
}
