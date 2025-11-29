import { Module } from '@nestjs/common';
import { ScriptsManager } from './scripts-manager/scripts-manager.service';
import { SafetyAgent } from './safety-agents/safety.agent';
import { EnergyAgent } from './energy-agent/energy.agent';
import { PersonalityAgent } from './personality-agent/personality.agent';
import { AgentCoordinatorService } from './agents-coordinator.service';
import { GeminiService } from '../services/gemini.service';
import { ConversationMemoryService } from './conversation-memory/conversation-memory.service';

@Module({
    providers: [
    ScriptsManager,
    SafetyAgent,
    EnergyAgent,
    PersonalityAgent,
    AgentCoordinatorService,
    ConversationMemoryService,
    GeminiService,
  ],
  exports: [AgentCoordinatorService],
})
export class AgentsModule {}
