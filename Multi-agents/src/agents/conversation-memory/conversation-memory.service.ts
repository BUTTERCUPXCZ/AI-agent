import { Injectable } from '@nestjs/common';
import { Message } from './interfaces/Message';
import { EnergyState } from '../../interfaces';



@Injectable()
export class ConversationMemoryService {
  private messages: Message[] = [];
  private readonly maxMessages = 10; // Increased to 10 for better context

  // Add user message with optional energy state
  addUserMessage(content: string, energyState?: EnergyState) {
    this.messages.push({
      role: 'user',
      content,
      timestamp: new Date(),
      energyState, // Store energy if provided
    });
    this.trimHistory();
  }

  // Add agent message
  addAgentMessage(content: string) {
    this.messages.push({
      role: 'agent',
      content,
      timestamp: new Date(),
    });
    this.trimHistory();
  }

  private trimHistory() {
    if (this.messages.length > this.maxMessages * 2) {
      this.messages = this.messages.slice(-this.maxMessages * 2);
    }
  }

  // Get all messages
  getHistory(): Message[] {
    return this.messages;
  }

  // Get formatted history for AI prompts
  getFormattedHistory(): string {
    return this.messages
      .map(m => `${m.role === 'user' ? 'You' : 'Agent'}: ${m.content}`)
      .join('\n');
  }

  // NEW: Get formatted history with energy states
  getFormattedHistoryWithEnergy(): string {
    return this.messages
      .map(m => {
        const baseMsg = `${m.role === 'user' ? 'You' : 'Agent'}: ${m.content}`;
        if (m.energyState) {
          return `${baseMsg} [Energy: ${m.energyState.magnitude} ${m.energyState.quality}]`;
        }
        return baseMsg;
      })
      .join('\n');
  }

  // Get last user message
  getLastUserMessage(): string | null {
    const userMessages = this.messages.filter(m => m.role === 'user');
    return userMessages.length > 0 
      ? userMessages[userMessages.length - 1].content 
      : null;
  }

  // NEW: Get last N user messages
  getLastNUserMessages(n: number): Message[] {
    return this.messages
      .filter(m => m.role === 'user')
      .slice(-n);
  }

  // NEW: Get energy history (for pattern detection)
  getEnergyHistory(): EnergyState[] {
    return this.messages
      .filter(m => m.role === 'user' && m.energyState)
      .map(m => m.energyState!);
  }

  // NEW: Get last N energy states
  getLastNEnergyStates(n: number): EnergyState[] {
    return this.getEnergyHistory().slice(-n);
  }

  // NEW: Analyze energy trend
  getEnergyTrend(): {
    trend: 'rising' | 'falling' | 'stable' | 'unknown';
    averageMagnitude: string;
    concerningPattern: boolean;
  } {
    const energyHistory = this.getEnergyHistory();
    
    if (energyHistory.length < 3) {
      return {
        trend: 'unknown',
        averageMagnitude: 'unknown',
        concerningPattern: false
      };
    }

    const recent = energyHistory.slice(-3);
    
    // Map magnitude to numbers
    const magnitudeMap = {
      'none': 0,
      'low': 1,
      'medium': 2,
      'high': 3,
      'explosive': 4
    };

    const values = recent.map(e => magnitudeMap[e.magnitude]);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    // Determine trend
    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    if (values[2] > values[0] + 1) trend = 'rising';
    if (values[2] < values[0] - 1) trend = 'falling';

    // Check concerning patterns
    const concerningPattern = 
      recent.every(e => e.magnitude === 'low' || e.magnitude === 'none') ||
      recent.every(e => e.engagement === 'checking_out' || e.engagement === 'avoiding') ||
      recent.filter(e => e.nervousSystem === 'fight' || e.nervousSystem === 'flight' || e.nervousSystem === 'freeze').length >= 2;

    return {
      trend,
      averageMagnitude: avg < 1.5 ? 'low' : avg < 2.5 ? 'medium' : 'high',
      concerningPattern
    };
  }

  // NEW: Get conversation stats
  getConversationStats(): {
    totalMessages: number;
    userMessages: number;
    agentMessages: number;
    averageUserResponseLength: number;
    conversationDuration: number; // in seconds
  } {
    const userMessages = this.messages.filter(m => m.role === 'user');
    const agentMessages = this.messages.filter(m => m.role === 'agent');

    const avgLength = userMessages.length > 0
      ? userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length
      : 0;

    const duration = this.messages.length > 0
      ? (this.messages[this.messages.length - 1].timestamp.getTime() - 
         this.messages[0].timestamp.getTime()) / 1000
      : 0;

    return {
      totalMessages: this.messages.length,
      userMessages: userMessages.length,
      agentMessages: agentMessages.length,
      averageUserResponseLength: Math.round(avgLength),
      conversationDuration: Math.round(duration)
    };
  }

  // Reset memory
  reset() {
    this.messages = [];
  }

  // NEW: Clear old messages but keep recent context
  clearOldMessages(keepLast: number = 5) {
    if (this.messages.length > keepLast * 2) {
      this.messages = this.messages.slice(-keepLast * 2);
    }
  }
}