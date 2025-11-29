export interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}