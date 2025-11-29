import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../services/gemini.service';
import { EnergyAnalysis, ResponseTone } from './interfaces/interface';

@Injectable()
export class EnergyAgent {
  constructor(private readonly gemini: GeminiService) {}

  async analyzeEnergy(input: string) {
    const prompt = `
    Classify user energy, cooperation, and emotion.
    Be accurate and honest.

    User: "${input}"

    Return ONLY JSON:
    {
      "energy": "low" | "medium" | "high",
      "type": "cooperative" | "resistant" | "confused" | "playful" | "distressed",
      "emotion": "happy" | "sad" | "curious" | "tired" | "overwhelmed" | "neutral"
    }
    `;

        return await this.gemini.generateJson(prompt);
      }


   async getResponseTone(input: string): Promise<ResponseTone> {
      const analysis = await this.analyzeEnergy(input);
  
      if (!analysis) {
        // Fallback if analysis fails
        return {
          energyLevel: 'balanced',
          style: 'natural and conversational',
          suggestions: ['stay warm', 'be authentic', 'maintain girlfriend vibe']
        };
      }
      
      // HIGH ENERGY + PLAYFUL
      if (analysis.energy === 'high' && analysis.type === 'playful') {
        return {
          energyLevel: 'excited',
          style: 'match their excitement and playfulness',
          suggestions: [
            'use exclamations',
            'add playful emojis',
            'show enthusiasm',
            'be bubbly'
          ]
        };
      }

      // HIGH ENERGY (general)
      if (analysis.energy === 'high') {
        return {
          energyLevel: 'excited',
          style: 'match their high energy',
          suggestions: [
            'be enthusiastic',
            'use exclamations',
            'show excitement'
          ]
        };
      }
      
      // LOW ENERGY or SAD
      if (analysis.energy === 'low' || analysis.emotion === 'sad' || analysis.emotion === 'tired') {
        return {
          energyLevel: 'calm',
          style: 'be gentle, supportive, and understanding',
          suggestions: [
            'use softer language',
            'show empathy',
            'keep it brief',
            'add comfort emojis like 🫶 or 💗'
          ]
        };
      }
      
      // CURIOUS
      if (analysis.type === 'curious' || analysis.emotion === 'curious') {
        return {
          energyLevel: 'balanced',
          style: 'be encouraging and engaging',
          suggestions: [
            'acknowledge their curiosity',
            'build anticipation',
            'be inviting'
          ]
        };
      }
      
      // CONFUSED
      if (analysis.type === 'confused') {
        return {
          energyLevel: 'balanced',
          style: 'be clear and reassuring',
          suggestions: [
            'be patient',
            'explain gently',
            'stay supportive'
          ]
        };
      }
      
      // RESISTANT
      if (analysis.type === 'resistant') {
        return {
          energyLevel: 'balanced',
          style: 'be understanding but persistent',
          suggestions: [
            'acknowledge their hesitation',
            'stay sweet',
            'gently encourage'
          ]
        };
      }
      
      // DEFAULT: MEDIUM ENERGY / COOPERATIVE
      return {
        energyLevel: 'balanced',
        style: 'natural and conversational',
        suggestions: [
          'stay warm',
          'be authentic',
          'maintain girlfriend vibe'
        ]
      };
}
}
