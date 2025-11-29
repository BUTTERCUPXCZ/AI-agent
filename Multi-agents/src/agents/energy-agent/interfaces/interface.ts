 export interface EnergyAnalysis {
  energy: 'low' | 'medium' | 'high';
  type: 'cooperative' | 'resistant' | 'confused' | 'playful' | 'distressed';
  emotion: 'happy' | 'sad' | 'curious' | 'tired' | 'overwhelmed' | 'neutral';
}

 export interface ResponseTone {
  energyLevel: 'calm' | 'balanced' | 'excited';
  style: string;
  suggestions: string[];
}