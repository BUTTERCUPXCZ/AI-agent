import { Injectable } from '@nestjs/common';
import { Message } from './interfaces/Message';



@Injectable()
export class ConversationMemoryService {
  private messages: Message[] = [];
  private readonly maxMessages = 5; // Keep last 5 exchanges

  addUserMessage(content: string) {
    this.messages.push({
      role: 'user',
      content,
      timestamp: new Date(),
    });
    this.trimHistory();
  }

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

  getHistory(): Message[] {
    return this.messages;
  }

  getFormattedHistory(): string {
    return this.messages
      .map(m => `${m.role === 'user' ? 'You' : 'Agent'}: ${m.content}`)
      .join('\n');
  }

  getLastUserMessage(): string | null {
    const userMessages = this.messages.filter(m => m.role === 'user');
    return userMessages.length > 0 
      ? userMessages[userMessages.length - 1].content 
      : null;
  }

  reset() {
    this.messages = [];
  }
}