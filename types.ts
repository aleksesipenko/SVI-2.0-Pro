
export interface User {
  id: string;
  name: string;
  email: string;
  quota: {
    used: number;
    total: number;
    resetDate: string;
  };
  tier: 'free' | 'plus' | 'pro';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export enum NavigationTab {
  CHAT = 'chat',
  CAST = 'cast',
  PROFILE = 'profile'
}

export interface Attachment {
  type: 'image';
  url: string;
  base64?: string;
}

export interface Clip {
  index: number;
  description: string;
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface ProjectPlan {
  summary: string;
  bible: string;
  clips: Clip[];
  negativePrompt: string;
  checklist: string[];
}

export interface DirectorOption {
  id: string;
  label: string;
  description: string;
  prompt_addon: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  suggestions?: string[];
  options?: DirectorOption[];
  projectPlan?: ProjectPlan;
}

export interface Character {
  id: string;
  name: string;
  portrait: string; // Detailed textual description optimized for T5
  tags: string[];
  lastUsed: number;
}

export interface Session {
  id: string;
  title: string;
  lastUpdate: number;
  status: 'draft' | 'rendering' | 'completed';
  type: 'T2V' | 'I2V';
  thumbnailUrl?: string;
  previewFrames?: string[];
  characterInvariants?: string[];
  selectedCharacterIds?: string[];
}

export type HistoryViewMode = 'sidebar' | 'visual-hub';
