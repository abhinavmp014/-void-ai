export type ModelType = 'void-4' | 'gpt-4' | 'claude-3-5' | 'gemini-pro';

export interface Model {
  id: ModelType;
  name: string;
  description: string;
  isPremium: boolean;
  badge?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type: 'text' | 'code' | 'image';
  modelId?: ModelType;
  imageUrl?: string;
  isStreaming?: boolean;
  sources?: GroundingSource[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface UserProfile {
  name: string;
  credits: number;
  tier: 'free' | 'pro';
}