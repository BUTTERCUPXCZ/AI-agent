export interface EnergyAnalysis {
  energy: 'low' | 'medium' | 'high';
  type: 'cooperative' | 'resistant' | 'confused' | 'playful' | 'distressed';
  emotion: 'happy' | 'sad' | 'curious' | 'tired' | 'overwhelmed' | 'neutral';
}

 export interface ResponseTone {
  shouldContinue: boolean;
  energyToMatch: 'low' | 'medium' | 'high';
  tone: 'excited' | 'calm' | 'gentle' | 'playful' | 'concerned';
  style: string;
  warnings?: string[];
  suggestions: string[];
  reasoning?: string;
}


export interface EnergyState {
  // Core energy dimensions
  magnitude: 'none' | 'low' | 'medium' | 'high' | 'explosive';
  direction: 'giving' | 'taking' | 'neutral' | 'withdrawing';
  
  // Cooperation spectrum
  cooperation: 'cooperative' | 'resistant' | 'combative' | 'confused' | 'playful' | 'distressed';
  
  // Emotional layer
  emotion: 'happy' | 'sad' | 'curious' | 'tired' | 'overwhelmed' | 'neutral' | 'anxious' | 'jealous' | 'loving' | 'angry';
  
  // Nervous system state (CRITICAL - from your context)
  nervousSystem: 'calm' | 'activated' | 'fight' | 'flight' | 'freeze' | 'fawn';
  
  // Energy quality
  quality: 'warm' | 'cold' | 'flat' | 'sharp' | 'soft' | 'intense';
  
  // Engagement level
  engagement: 'fully_present' | 'distracted' | 'checking_out' | 'avoiding';
  
  // Timestamp for tracking
  timestamp: number;
}

export interface EnergyShift {
  previous: EnergyState;
  current: EnergyState;
  shiftType: 'escalation' | 'de-escalation' | 'withdrawal' | 're-engagement' | 'mismatch' | 'stable';
  severity: 'normal' | 'concerning' | 'critical';
  reason: string;
}


export interface SafetyCheckResult {
  safe: boolean;
  shouldPause: boolean;
  shouldStop: boolean;
  reason: string;
  responseMessage?: string;
  flags: string[];
}