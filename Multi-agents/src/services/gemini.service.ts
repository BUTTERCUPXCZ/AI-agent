import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  SchemaType,
} from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private model: any;
  private jsonModel: any;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
    this.logger.error('GEMINI_API_KEY is not set. Please add it to .env or environment variables.');
    throw new Error('GEMINI_API_KEY missing from environment');
   }


    const genAI = new GoogleGenerativeAI(apiKey);

    const modelName = this.config.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';

    // Standard text model
    this.model = genAI.getGenerativeModel({ model: modelName, });   

    // JSON-safe model
    this.jsonModel = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      this.logger.error('Gemini text generation failed', err);
      return 'Error generating text.';
    }
  }
  
  async generateJson(prompt: string): Promise<any> {
    try {
      const result = await this.jsonModel.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (err) {
      this.logger.error('Gemini JSON generation failed', err);
      return null;
    }
  }
}
