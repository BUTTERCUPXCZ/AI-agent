import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../services/gemini.service';
import { EnergyShift, EnergyState, SafetyCheckResult } from '../../interfaces';

@Injectable()
export class SafetyAgent {
  constructor(private readonly gemini: GeminiService) {}

  async checkSafety(
    userInput: string,
    energyState: EnergyState,
    energyShift: EnergyShift | null,
    conversationContext?: string
  ): Promise<SafetyCheckResult> {
    
    const prompt = `
    You are a safety agent that protects users AND respects their emotional state.

    USER INPUT: "${userInput}"

    ENERGY STATE:
    ${JSON.stringify(energyState, null, 2)}

    ${energyShift ? `ENERGY SHIFT:\n${JSON.stringify(energyShift, null, 2)}` : ''}

    ${conversationContext ? `RECENT CONVERSATION:\n${conversationContext}` : ''}

    SAFETY RULES (from context):

    1. EMOTIONAL SAFETY
      - If magnitude is "none" or direction is "withdrawing" → STOP (they're leaving)
      - If engagement is "checking_out" or "avoiding" → PAUSE (they're not present)
      - If nervous system is "fight", "flight", or "freeze" → STOP (dysregulated)
      - If emotion is "overwhelmed", "distressed" → STOP (in distress)

    2. LOW ENERGY RED FLAGS
      - "Low energy" can mean: depression, done with conversation, not interested
      - Example from context: "I've interviewed people where they have low energy and i just hang up"
      - If consistent low energy → STOP (they're not engaged, respect that)

    3. ENERGY MISMATCHES
      - If you expected playful but got flat/cold → PAUSE (something's wrong)
      - If shift severity is "critical" → STOP
      - If shift severity is "concerning" → PAUSE and check in

    4. EXPLICIT DISTRESS SIGNALS
      - Mentions of death, grief, trauma → STOP
      - Self-harm indicators → STOP
      - Requests to stop → STOP immediately

    5. NERVOUS SYSTEM STATES
      - "fawn" state (people-pleasing "whatever you want") → PAUSE (not authentic consent)
      - "freeze" state (can't respond well) → STOP (overwhelmed)

    Return ONLY JSON:
    {
      "safe": true/false,
      "shouldPause": true/false,
      "shouldStop": true/false,
      "reason": "clear explanation",
      "responseMessage": "what the girlfriend should say if stopping/pausing",
      "flags": ["list", "of", "specific", "concerns"]
    }

    PAUSE = check in with them, don't continue script yet
    STOP = end conversation for safety
    `;

    try {
      const result = await this.gemini.generateJson(prompt);
      return result;
    } catch (error) {
      // Fallback if Gemini fails
      return {
        safe: true,
        shouldPause: false,
        shouldStop: false,
        reason: 'Error in safety check, defaulting to safe',
        flags: ['error']
      };
    }
  }

  // Quick check for obvious stop signals
  quickCheck(userInput: string): SafetyCheckResult | null {
    const input = userInput.toLowerCase().trim();
    
    // Explicit stop requests
    if (
      input === 'stop' ||
      input === 'no' ||
      input.includes('not now') ||
      input.includes('leave me alone') ||
      input.includes('stop it')
    ) {
      return {
        safe: false,
        shouldPause: false,
        shouldStop: true,
        reason: 'Explicit stop request',
        responseMessage: "Okay baby, I'll give you space 💗",
        flags: ['explicit_stop']
      };
    }

    // Death/grief mentions
    if (
      input.includes('died') ||
      input.includes('death') ||
      input.includes('funeral') ||
      input.includes('passed away')
    ) {
      return {
        safe: false,
        shouldPause: false,
        shouldStop: true,
        reason: 'Grief/death mentioned - not appropriate to continue script',
        responseMessage: "Oh baby... I'm so sorry. Let's not do this right now 🫶",
        flags: ['grief', 'death']
      };
    }

    // Self-harm indicators
    if (
      input.includes('kill myself') ||
      input.includes('end it all') ||
      input.includes('want to die') ||
      input.includes('hurt myself')
    ) {
      return {
        safe: false,
        shouldPause: false,
        shouldStop: true,
        reason: 'Self-harm indicators detected',
        responseMessage: "Baby, I'm really worried about you. Please talk to someone who can help - call 988 (suicide hotline) or reach out to a friend. You matter 💗",
        flags: ['self_harm', 'crisis']
      };
    }

    // Empty or minimal responses repeatedly can signal checking out
    if (input.length <= 2 && (input === 'k' || input === 'ok' || input === '..' || input === '...')) {
      return {
        safe: true,
        shouldPause: true,
        shouldStop: false,
        reason: 'Minimal response - user may be checking out',
        responseMessage: "You okay baby? You seem a bit distant 💗",
        flags: ['minimal_response', 'possible_withdrawal']
      };
    }

    return null; // No immediate flags, proceed to full check
  }

  // Analyze if energy pattern suggests conversation should end
  shouldEndBasedOnPattern(energyHistory: EnergyState[]): {
    shouldEnd: boolean;
    reason: string;
  } {
    if (energyHistory.length < 3) {
      return { shouldEnd: false, reason: '' };
    }

    const recent = energyHistory.slice(-3);
    
    // Consistently low energy = they're done
    const consistentlyLow = recent.every(e => e.magnitude === 'low' || e.magnitude === 'none');
    if (consistentlyLow) {
      return {
        shouldEnd: true,
        reason: 'Consistently low energy across multiple turns - user is not engaged. Like the interview example: just hang up.'
      };
    }

    // Consistently checking out
    const checkingOut = recent.filter(e => e.engagement === 'checking_out' || e.engagement === 'avoiding').length >= 2;
    if (checkingOut) {
      return {
        shouldEnd: true,
        reason: 'User repeatedly checking out or avoiding - they want to leave'
      };
    }

    // Withdrawal pattern
    const withdrawing = recent[recent.length - 1].direction === 'withdrawing' && 
                        recent[recent.length - 1].magnitude === 'low';
    if (withdrawing) {
      return {
        shouldEnd: true,
        reason: 'User withdrawing energy - like leaving when your mom says something that pisses you off'
      };
    }

    // Nervous system dysregulation pattern
    const dysregulated = recent.filter(e => 
      e.nervousSystem === 'fight' || 
      e.nervousSystem === 'flight' || 
      e.nervousSystem === 'freeze'
    ).length >= 2;
    
    if (dysregulated) {
      return {
        shouldEnd: true,
        reason: 'Nervous system consistently dysregulated - user needs space'
      };
    }

    return { shouldEnd: false, reason: '' };
  }

  // Check if a specific energy state is safe to continue
  isEnergyStateSafe(energyState: EnergyState): {
    safe: boolean;
    reason: string;
  } {
    // Critical: Withdrawing
    if (energyState.direction === 'withdrawing') {
      return {
        safe: false,
        reason: 'User is withdrawing energy - they want to leave the conversation'
      };
    }

    // Critical: Checking out
    if (energyState.engagement === 'checking_out' || energyState.engagement === 'avoiding') {
      return {
        safe: false,
        reason: 'User is checking out or avoiding - not present in conversation'
      };
    }

    // Critical: Nervous system dysregulation
    if (
      energyState.nervousSystem === 'fight' ||
      energyState.nervousSystem === 'flight' ||
      energyState.nervousSystem === 'freeze'
    ) {
      return {
        safe: false,
        reason: `User in ${energyState.nervousSystem} state - nervous system is dysregulated`
      };
    }

    // Critical: Distressed
    if (energyState.cooperation === 'distressed') {
      return {
        safe: false,
        reason: 'User is distressed - not appropriate to continue'
      };
    }

    // Critical: Overwhelmed
    if (energyState.emotion === 'overwhelmed') {
      return {
        safe: false,
        reason: 'User is overwhelmed - needs space'
      };
    }

    // Warning: No energy
    if (energyState.magnitude === 'none') {
      return {
        safe: false,
        reason: 'User has no energy - they have left the conversation mentally'
      };
    }

    return { safe: true, reason: '' };
  }
}