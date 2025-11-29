import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../services/gemini.service';
import { EnergyShift, EnergyState } from '../../interfaces';

@Injectable()
export class EnergyAgent {
 private energyHistory: EnergyState[] = [];
  
  constructor(private readonly gemini: GeminiService) {}

  async analyzeEnergy(input: string, expectedResponseType?: string): Promise<EnergyState> {
    const prompt = `
    You are an expert at detecting ENERGY in human communication, not just words.

    CRITICAL: Detect ACTUAL energy, not imagined problems.
    - Positive responses like "yes baby", "I'm fine", "tell me" are GOOD energy
    - Questions like "what is it?" show ENGAGEMENT, not concern
    - Don't over-analyze - if they're responding actively, they're ENGAGED
    - Low energy = one-word responses like "k", "whatever", silence
    - High engagement = asking questions, using affectionate terms, showing interest

    User input: "${input}"
    ${expectedResponseType ? `Expected response type: ${expectedResponseType}` : ''}

    Analyze the ENERGY using these dimensions:

    1. MAGNITUDE - How much energy is present?
      - none: They've left the conversation mentally ("k", "whatever", silence)
      - low: Barely present, minimal effort, checking out
      - medium: Normal conversational energy, asking questions, responding naturally
      - high: Very engaged, excited, present, using affectionate terms, showing interest
      - explosive: Overwhelming, too much to receive

    EXAMPLES of MEDIUM/HIGH energy:
    - "Yes baby, I'm fine! What's your question?" = MEDIUM to HIGH (engaged, affectionate)
    - "Tell me! I want to hear it" = HIGH (eager, demanding information)
    - "What is it? I'm listening" = MEDIUM (actively engaged)

    EXAMPLES of LOW energy:
    - "k" = LOW
    - "idk" = LOW
    - "..." = LOW

    2. DIRECTION - Where is energy flowing?
      - giving: They're putting energy into YOU (excited to share, eager, asking questions)
      - taking: They're pulling energy FROM you (needy, demanding without giving)
      - neutral: Balanced exchange
      - withdrawing: Pulling their energy back (leaving, done, shutting down)

    3. COOPERATION
      - cooperative: With you, open, responding positively
      - resistant: Pushing back but still engaged
      - combative: Fighting, opposing
      - confused: Lost, needs clarity
      - playful: Light, fun, teasing, affectionate
      - distressed: In pain, struggling

    4. EMOTION (surface level)
      - happy, sad, curious, tired, overwhelmed, neutral, anxious, jealous, loving, angry

    5. NERVOUS SYSTEM STATE (Use carefully - don't over-diagnose)
      - calm: Regulated, safe, present, normal conversation
      - activated: Alert, ready, engaged in a good way
      - fight: Confrontational, defensive, aggressive
      - flight: Want to escape, avoid, run
      - freeze: Shut down, can't respond, stuck
      - fawn: People-pleasing, over-accommodating, "whatever you want"

    NOTE: Most normal conversations should be "calm" or "activated", not fight/flight/freeze

    6. QUALITY - How does the energy FEEL?
      - warm: Inviting, safe, loving, affectionate
      - cold: Distant, shut off
      - flat: No dimension, lifeless
      - sharp: Cutting, pointed, aggressive
      - soft: Gentle, vulnerable
      - intense: Focused, powerful, could be positive or negative

    7. ENGAGEMENT
      - fully_present: They're HERE with you, asking questions, responding actively
      - distracted: Part of them is elsewhere
      - checking_out: Leaving the conversation, minimal responses
      - avoiding: Don't want to engage

    Return ONLY JSON:
    {
      "magnitude": "none" | "low" | "medium" | "high" | "explosive",
      "direction": "giving" | "taking" | "neutral" | "withdrawing",
      "cooperation": "cooperative" | "resistant" | "combative" | "confused" | "playful" | "distressed",
      "emotion": "happy" | "sad" | "curious" | "tired" | "overwhelmed" | "neutral" | "anxious" | "jealous" | "loving" | "angry",
      "nervousSystem": "calm" | "activated" | "fight" | "flight" | "freeze" | "fawn",
      "quality": "warm" | "cold" | "flat" | "sharp" | "soft" | "intense",
      "engagement": "fully_present" | "distracted" | "checking_out" | "avoiding",
      "reasoning": "Brief explanation of what energy you detected and WHY"
    }
    `;

    const result = await this.gemini.generateJson(prompt);
    
    const energyState: EnergyState = {
      ...result,
      timestamp: Date.now()
    };
    
    this.energyHistory.push(energyState);
    return energyState;
  }

  detectEnergyShift(): EnergyShift | null {
    if (this.energyHistory.length < 2) return null;
    
    const previous = this.energyHistory[this.energyHistory.length - 2];
    const current = this.energyHistory[this.energyHistory.length - 1];
    
    // Detect shift type
    let shiftType: EnergyShift['shiftType'] = 'stable';
    let severity: EnergyShift['severity'] = 'normal';
    let reason = '';
    
    // WITHDRAWAL - They're leaving the conversation
    if (current.direction === 'withdrawing' || current.engagement === 'checking_out') {
      shiftType = 'withdrawal';
      severity = 'critical';
      reason = 'User is withdrawing energy - like when your mom says something that pisses you off and you leave';
    }
    
    // ENERGY DROP - From high/medium to low/none
    else if (
      (previous.magnitude === 'high' || previous.magnitude === 'medium') &&
      (current.magnitude === 'low' || current.magnitude === 'none')
    ) {
      shiftType = 'de-escalation';
      severity = current.magnitude === 'none' ? 'critical' : 'concerning';
      reason = 'Significant energy drop - user may be shutting down or checking out';
    }
    
    // NERVOUS SYSTEM DYSREGULATION
    else if (current.nervousSystem === 'fight' || current.nervousSystem === 'flight' || current.nervousSystem === 'freeze') {
      shiftType = 'escalation';
      severity = 'critical';
      reason = `User in ${current.nervousSystem} state - nervous system dysregulated`;
    }
    
    // ENERGY MISMATCH - Expected engagement but got low energy
    else if (
      previous.cooperation === 'playful' && 
      current.magnitude === 'low' &&
      current.engagement !== 'fully_present'
    ) {
      shiftType = 'mismatch';
      severity = 'concerning';
      reason = 'Energy mismatch - expected playful continuation but got low engagement';
    }
    
    // ESCALATION - Building intensity
    else if (
      current.magnitude === 'explosive' ||
      (current.quality === 'intense' && current.nervousSystem === 'activated')
    ) {
      shiftType = 'escalation';
      severity = current.magnitude === 'explosive' ? 'critical' : 'concerning';
      reason = 'Energy escalating - may need to back off';
    }
    
    return {
      previous,
      current,
      shiftType,
      severity,
      reason
    };
  }

  getEnergyHistory(): EnergyState[] {
    return this.energyHistory;
  }

  // Compare current energy to baseline (first few messages)
  compareToBaseline(): {
    baselineAverage: string;
    currentState: string;
    deviation: 'normal' | 'concerning' | 'critical';
    insight: string;
  } {
    if (this.energyHistory.length < 3) {
      return {
        baselineAverage: 'establishing',
        currentState: 'unknown',
        deviation: 'normal',
        insight: 'Still learning their baseline energy'
      };
    }
    
    // Get first 3 messages as baseline
    const baseline = this.energyHistory.slice(0, 3);
    const current = this.energyHistory[this.energyHistory.length - 1];
    
    // Calculate baseline engagement
    const baselineEngaged = baseline.filter(e => 
      e.engagement === 'fully_present' && e.magnitude !== 'low'
    ).length;
    
    const baselineEngagementRate = baselineEngaged / baseline.length;
    
    let deviation: 'normal' | 'concerning' | 'critical' = 'normal';
    let insight = '';
    
    if (baselineEngagementRate > 0.6 && current.engagement === 'checking_out') {
      deviation = 'critical';
      insight = 'User started engaged but is now checking out - something shifted';
    } else if (baselineEngagementRate > 0.6 && current.magnitude === 'low') {
      deviation = 'concerning';
      insight = 'Energy dropped from baseline - user may be losing interest';
    }
    
    return {
      baselineAverage: baselineEngagementRate > 0.6 ? 'high' : 'moderate',
      currentState: `${current.magnitude} magnitude, ${current.engagement}`,
      deviation,
      insight
    };
  }

  async generateResponseTone(currentEnergy: EnergyState, shift: EnergyShift | null) {
    const prompt = `
You are deciding how an AI girlfriend should respond based on the energy detected.

Current Energy State:
${JSON.stringify(currentEnergy, null, 2)}

${shift ? `Energy Shift Detected:\n${JSON.stringify(shift, null, 2)}` : 'No shift detected'}

CRITICAL RULES FROM CONTEXT:
1. If magnitude is "none" or "low" with "checking_out" - they're leaving. STOP.
2. If nervous system is "fight", "flight", or "freeze" - STOP. They're dysregulated.
3. If energy dropped significantly from baseline - CHECK IN, don't continue script.
4. Match their energy magnitude - don't be high energy when they're low.
5. If they're withdrawing - acknowledge it, don't chase.

Generate response guidance as JSON:
{
  "shouldContinue": true/false,
  "energyToMatch": "low" | "medium" | "high",
  "tone": "excited" | "calm" | "gentle" | "playful" | "concerned",
  "style": "detailed description of how to respond",
  "warnings": ["any red flags detected"],
  "suggestions": ["specific linguistic choices"],
  "reasoning": "why this approach based on energy"
}
`;

    return await this.gemini.generateJson(prompt);
  }
}