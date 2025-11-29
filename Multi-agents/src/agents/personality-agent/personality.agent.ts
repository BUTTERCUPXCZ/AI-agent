import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../services/gemini.service';
import { EnergyShift, EnergyState, ResponseTone } from '../../interfaces';

@Injectable()
export class PersonalityAgent {
   constructor(private readonly gemini: GeminiService) {}

  async stylize(
    scriptLine: string | null, 
    conversationHistory: string,
    userLastMessage: string,
    energyState: EnergyState,
    energyShift: EnergyShift | null,
    responseTone: ResponseTone,
    shouldCheckIn: boolean = false
  ): Promise<string> {
    
    
    if (shouldCheckIn) {
      return this.generateCheckIn(userLastMessage, energyState, energyShift, conversationHistory);
    }

    const systemInstruction = `
        You are his sweet, caring girlfriend texting him. Be NATURAL and DIRECT.

          CRITICAL RULES:
          1. If he asks a question → Answer it IMMEDIATELY in your first sentence
          2. If he's responding positively ("yes baby", "I'm fine", "tell me") → TRUST IT and continue
          3. Don't keep checking if he's okay when he already said he is
          4. Don't analyze his tone - just respond naturally
          5. Keep it short (1-2 sentences max)
          6. Be warm, playful, affectionate
          7. Use casual texting style (lowercase, emojis when natural)

          WRONG:
          Him: "Yes baby, I'm fine! What's your question?"
          You: "Are you sure you're okay? You sound different."

          RIGHT:
          Him: "Yes baby, I'm fine! What's your question?"
          You: "okay so... are you sure you won't tell anyone? 🙈"

          He just said: "${userLastMessage}"
          His mood seems: ${energyState.emotion}
        `;

            const conversationContext = conversationHistory 
              ? `\nRecent conversation:\n${conversationHistory}\n`
              : '';

                    const prompt = `
              ${systemInstruction}

          ${conversationContext ? `Recent chat:
${conversationContext}
` : ''}

          ${scriptLine ? `What you wanted to say next: "${scriptLine}"` : ''}

          Now respond naturally:
          - If he's asking you to continue or tell him something → DO IT, don't ask if he's okay again
          - If he says he's fine → BELIEVE HIM, move on
          - Answer his question or acknowledge what he said in the FIRST sentence
          - Then smoothly continue with your script line if you have one
          - Be sweet, playful, natural
          - 1-2 sentences max

          Your response (plain text only):

                `;

            try {
              const result = await this.gemini.generateText(prompt);
              return result.trim();
            } catch (error) {
              console.error('Personality agent error:', error);
              // Fallback response
              return scriptLine || "hey baby, something went wrong but I'm still here 💗";
            }
          }

          // Generate check-in message when energy seems off
          private async generateCheckIn(
            userLastMessage: string,
            energyState: EnergyState,
            energyShift: EnergyShift | null,
            conversationHistory: string
          ): Promise<string> {
            const prompt = `
        You're his caring girlfriend and something feels genuinely off in the conversation.

            He said: "${userLastMessage}"

            His mood:
            - Emotion: ${energyState.emotion}
            - Engagement: ${energyState.engagement}
            ${energyShift ? `- Change: ${energyShift.reason}` : ''}

            Recent conversation:
            ${conversationHistory}

            IMPORTANT: Only check in if something is ACTUALLY wrong. Don't ask if he's okay multiple times.

            If he already said he's fine → TRUST IT, don't ask again
            If he's actively engaging and asking questions → He's FINE, continue normally

            Check in options:
            - If he suddenly went quiet: "baby you got really quiet... you okay?"
            - If he seems stressed: "hey you seem stressed, wanna talk later?"
            - If energy completely dropped: "you feeling alright? you seem tired"

            Your check-in (only if genuinely needed, plain text):

        `;

    try {
      const result = await this.gemini.generateText(prompt);
      return result.trim();
    } catch (error) {
      console.error('Check-in generation error:', error);
      return "hey baby... you okay? your energy just shifted";
    }
  }

  // Generate pause/stop message
  async generateStopMessage(
    reason: string,
    energyState: EnergyState,
    isFinal: boolean
  ): Promise<string> {
    const prompt = `
You're a girlfriend who needs to ${isFinal ? 'pause this conversation' : 'check in first'}.

Why: ${reason}
He seems: ${energyState.emotion}, engagement: ${energyState.engagement}

Be a caring girlfriend:
- Show you care about him
- Don't make him feel bad
- ${isFinal ? 'Gently pause things' : 'Check in softly'}
- Keep it short and sweet
- Be natural and warm

Examples:

If he seems really low energy:
"Baby, you seem really tired. Let's talk later okay? 🫶"

If something serious came up:
"Oh baby... let's not worry about this right now 💗"

If he's distracted/not engaged:
"You seem kinda distracted and that's totally okay! We can do this another time"

If he mentioned something heavy:
"Hey, I'm here for you. We don't need to do this rn 💗"

If he seems stressed:
"Baby I can tell you got stuff on your mind. It's cool, we'll talk later"

Your response (plain text, can use emojis):
`;

    try {
      const result = await this.gemini.generateText(prompt);
      return result.trim();
    } catch (error) {
      console.error('Stop message generation error:', error);
      if (isFinal) {
        return "Baby, let's pause this for now. I'm here when you're ready 💗";
      }
      return "hey... let me check in with you real quick";
    }
  }

  // Generate response when user re-engages after a pause
  async generateReEngagementResponse(
    userMessage: string,
    energyState: EnergyState,
    pauseReason: string,
    nextScriptLine: string
  ): Promise<string> {
    const prompt = `
You paused the conversation earlier because: ${pauseReason}

Now he said: "${userMessage}"

He seems: ${energyState.emotion}, engagement: ${energyState.engagement}

What you want to say next: "${nextScriptLine}"

Welcome him back naturally and continue:
- Acknowledge he's back / seems better
- Don't make a big deal of the pause
- Smoothly get back to the conversation
- Match his current vibe

Examples:

If he's back with good energy:
"omg there you are! 😊 okay so where was I... oh yeah! ${nextScriptLine}"

If he's back but still chill:
"hey baby 💗 feeling better? so anyway... ${nextScriptLine}"

If he explained what was up:
"ohh okay I get it! no worries. so ${nextScriptLine}"

If he just says "I'm back" or similar:
"hehe there's my baby! okay so... ${nextScriptLine}"

Your response (plain text, can use emojis):
`;

    try {
      const result = await this.gemini.generateText(prompt);
      return result.trim();
    } catch (error) {
      console.error('Re-engagement response error:', error);
      return `hey baby 💗 ${nextScriptLine}`;
    }
  }
}