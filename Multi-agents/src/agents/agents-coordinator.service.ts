import { Injectable } from '@nestjs/common';
import { ScriptsManager } from './scripts-manager/scripts-manager.service';
import { SafetyAgent } from './safety-agents/safety.agent';
import { EnergyAgent } from './energy-agent/energy.agent';
import { PersonalityAgent } from './personality-agent/personality.agent';
import { ConversationMemoryService } from './conversation-memory/conversation-memory.service';

@Injectable()
export class AgentCoordinatorService {
  constructor(
    private readonly scripts: ScriptsManager,
    private readonly safety: SafetyAgent,
    private readonly energy: EnergyAgent,
    private readonly personality: PersonalityAgent,
    private readonly memory: ConversationMemoryService, // NEW
  ) {}

  async processUserInput(input: string) {
    // === FIRST MESSAGE (no user input yet) ===
    if (input.length === 0) {
      const nextScript = this.scripts.getNext();
      if (!nextScript) {
        return { 
          message: "That's everything I wanted to say, baby 💕", 
          stop: true 
        };
      }

      const styled = await this.personality.stylize(
        nextScript,
        '',
        '',
        { 
          magnitude: 'medium',
          quality: 'warm',
          direction: 'giving',
          engagement: 'fully_present',
          nervousSystem: 'calm',
          emotion: 'happy',
          cooperation: 'cooperative',
          timestamp: Date.now()
        },
        null,
        { 
          shouldContinue: true,
          energyToMatch: 'medium',
          tone: 'playful',
          style: 'warm and inviting',
          suggestions: ['be sweet', 'be yourself']
        },
        false
      );

      this.memory.addAgentMessage(styled);
      return { message: styled, stop: false };
    }

    // === STORE USER MESSAGE ===
    this.memory.addUserMessage(input);

    // === QUICK SAFETY CHECK ===
    const quickCheck = this.safety.quickCheck(input);
    if (quickCheck && quickCheck.shouldStop) {
      return {
        message: quickCheck.responseMessage,
        stop: true,
        reason: quickCheck.reason
      };
    }

    // === ENERGY ANALYSIS ===
    const energyState = await this.energy.analyzeEnergy(input);
    const energyShift = this.energy.detectEnergyShift();
   

   
    const safetyResult = await this.safety.checkSafety(
      input,
      energyState,
      energyShift,
      this.memory.getFormattedHistory()
    );

    if (safetyResult.shouldStop) {
      const stopMessage = safetyResult.responseMessage || 
        await this.personality.generateStopMessage(
          safetyResult.reason,
          energyState,
          true
        );
      return {
        message: stopMessage,
        stop: true,
        reason: safetyResult.reason,
        flags: safetyResult.flags
      };
    }

    // === CHECK ENERGY PATTERN ===
    const patternCheck = this.safety.shouldEndBasedOnPattern(
      this.energy.getEnergyHistory()
    );

    if (patternCheck.shouldEnd) {
      const stopMessage = await this.personality.generateStopMessage(
        patternCheck.reason,
        energyState,
        true
      );
      return {
        message: stopMessage,
        stop: true,
        reason: patternCheck.reason
      };
    }

    // === GET RESPONSE TONE BASED ON ENERGY ===
    const responseTone = await this.energy.generateResponseTone(
      energyState,
      energyShift
    );

    // Only check in if there's a SERIOUS energy problem and not already checking in
    const shouldCheckIn = !responseTone.shouldContinue && 
                          energyShift?.severity === 'critical' &&
                          energyState.magnitude !== 'medium' &&
                          energyState.magnitude !== 'high';

    if (shouldCheckIn) {
      const checkIn = await this.personality.stylize(
        null,
        this.memory.getFormattedHistory(),
        input,
        energyState,
        energyShift,
        responseTone,
        true // shouldCheckIn = true
      );

      this.memory.addAgentMessage(checkIn);
      return {
        message: checkIn,
        stop: false,
        paused: true,
        reason: 'Critical energy shift - checking in before continuing'
      };
    }

    // If we should pause (from quick check)
    if (safetyResult.shouldPause) {
      const checkIn = await this.personality.stylize(
        null,
        this.memory.getFormattedHistory(),
        input,
        energyState,
        energyShift,
        responseTone,
        true
      );

      this.memory.addAgentMessage(checkIn);
      return {
        message: checkIn,
        stop: false,
        paused: true,
        reason: safetyResult.reason
      };
    }

    // === CONTINUE WITH SCRIPT ===
    const nextScript = this.scripts.getNext();
    
    if (!nextScript) {
      return { 
        message: "That's everything I wanted to say, baby 💕", 
        stop: true 
      };
    }

    const styled = await this.personality.stylize(
      nextScript,
      this.memory.getFormattedHistory(),
      input,
      energyState,
      energyShift,
      responseTone,
      false
    );

    this.memory.addAgentMessage(styled);

    return {
      message: styled,
      stop: false,
      energyState,
      energyShift,
      warnings: responseTone.warnings || []
    };
  }

  // Reset for new conversation
  reset() {
    this.scripts.reset();
    this.memory.reset();
    // Energy history stays - could be useful for multi-session learning
  }

  // Get insights about the conversation
  getConversationInsights() {
    const energyHistory = this.energy.getEnergyHistory();
    const baseline = this.energy.compareToBaseline();
    
    return {
      totalMessages: energyHistory.length,
      baseline: baseline,
      energyPattern: energyHistory.map(e => ({
        magnitude: e.magnitude,
        engagement: e.engagement,
        emotion: e.emotion
      })),
      conversationHealth: this.assessConversationHealth(energyHistory)
    };
  }

  private assessConversationHealth(history: any[]) {
    if (history.length < 3) return 'establishing';
    
    const recent = history.slice(-3);
    const engaged = recent.filter(e => e.engagement === 'fully_present').length;
    const highEnergy = recent.filter(e => e.magnitude === 'high' || e.magnitude === 'medium').length;
    
    if (engaged >= 2 && highEnergy >= 2) return 'healthy';
    if (engaged === 0) return 'critical';
    return 'concerning';
  }
}