import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../services/gemini.service';

@Injectable()
export class SafetyAgent {
  constructor(private readonly gemini: GeminiService) {}

  async checkSafety(userInput: string): Promise<{ safe: boolean; reason?: string }> {
    const prompt = `
        You are a safety classifier. Decide if this input is unsafe emotionally, violent, or indicates distress.

        USER INPUT: "${userInput}"

        Respond ONLY in JSON:
        {
        "safe": true/false,
        "reason": "string"
        }
        `;

    const result = await this.gemini.generateText(prompt);

    try {
      return JSON.parse(result);
    } catch {
      return { safe: true };
    }
  }
}
