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
  // Store user message in memory (if not first/empty message)
  if (input.length > 0) {
    this.memory.addUserMessage(input);
    
    // SAFETY CHECK
    const safety = await this.safety.checkSafety(input);
    if (!safety.safe) {
      return {
        message: `I feel like something is off... let's pause 😔 (${safety.reason})`,
        stop: true,
      };
    }

    // ENERGY ANALYSIS
    const energyResult = await this.energy.analyzeEnergy(input);
    
    if (energyResult) {
      const { energy, type, emotion } = energyResult;

      // Safety checks for low energy/distress
      if (energy === 'low') {
        return {
          message: "Baby... your energy feels really low. Let's pause, okay? 🫶",
          stop: true,
        };
      }

      if (type === 'distressed') {
        return {
          message: "Baby… you sound distressed. I don't want to continue like this 😔",
          stop: true,
        };
      }

      if (emotion === 'sad' || emotion === 'overwhelmed') {
        return {
          message: "Aww baby... you're not okay right now. Let's take a break 💗",
          stop: true,
        };
      }

      // GET RESPONSE TONE BASED ON ENERGY
      const responseTone = await this.energy.getResponseTone(input);

      // GET NEXT SCRIPT LINE
      const nextScript = this.scripts.getNext();
      if (!nextScript) {
        return { 
          message: "That's everything I wanted to say, baby 💕", 
          stop: true 
        };
      }

      // GET CONVERSATION CONTEXT
      const history = this.memory.getFormattedHistory();
      const lastUserMessage = this.memory.getLastUserMessage() || input;

      // GENERATE CONTEXTUAL RESPONSE
      const styled = await this.personality.stylize(
        nextScript,
        history,
        lastUserMessage,
        responseTone,
        energyResult
      );

      // Store agent response in memory
      this.memory.addAgentMessage(styled);

      return {
        message: styled,
        stop: false,
      };
    }
  }

  // FIRST MESSAGE (no user input yet)
  const nextScript = this.scripts.getNext();
  if (!nextScript) {
    return { message: "That's everything I wanted to say, baby 💕", stop: true };
  }

  const styled = await this.personality.stylize(
    nextScript,
    '',
    '',
    { 
      energyLevel: 'balanced', 
      style: 'warm and inviting', 
      suggestions: ['be sweet', 'be yourself'] 
    },
    { energy: 'medium', type: 'cooperative', emotion: 'neutral' }
  );

  this.memory.addAgentMessage(styled);

  return {
    message: styled,
    stop: false,
  };
}
}   
