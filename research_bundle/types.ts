
// Fix: Added the missing Attachment interface definition required by the Message interface.
export interface Attachment {
  type: 'image';
  url: string;
  base64?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  suggestions?: string[];
  options?: DirectorOption[];
  nodeId?: string; 
}

export interface DirectorOption {
  id: string;
  label: string;
  description: string;
  prompt_addon: string;
}

export interface StoryNode {
  id: string;
  projectId: string;
  parentId: string | null;
  branchId: string;
  index: number;
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  renderStage?: 'QUEUED' | 'ENRICHING' | 'LOADING' | 'SAMPLING' | 'ENCODING' | 'UPLOADING' | 'DONE';
  progress?: number;
  coherenceStatus: 'VALID' | 'BROKEN' | 'HEALED';
  createdAt: number;
}
