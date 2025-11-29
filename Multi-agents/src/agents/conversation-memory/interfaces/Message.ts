import { EnergyState } from '../../../interfaces';

export interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  energyState?: EnergyState;
}