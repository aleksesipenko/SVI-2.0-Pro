
import { RenderTask, RenderStage } from './types';

/**
 * SVI Pro API Client (Control Plane Bridge)
 * According to SSOT §14.6
 */

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'https://api.svipro.ai/v1';

export const sviApi = {
  async renderNode(payload: {
    projectId: string;
    parentId: string | null;
    prompt: string;
    mode: 'T2V' | 'I2V';
    tier: string;
    anchorPngUrl?: string;
  }): Promise<{ taskId: string; nodeId: string }> {
    // In production, this calls the FastAPI gateway
    // For Phase 6 bridge, we simulate the network request
    console.log("[API] Submitting Render Task:", payload);
    
    // Simulate API Response
    return {
      taskId: `tsk_${crypto.randomUUID()}`,
      nodeId: crypto.randomUUID()
    };
  },

  async getTaskStatus(taskId: string): Promise<RenderTask> {
    // Real implementation would fetch from /v1/tasks/:id
    return {
      id: taskId,
      nodeId: '',
      stage: 'SAMPLING',
      pct: 45
    };
  },

  async downloadToOpfs(url: string, path: string): Promise<void> {
    const response = await fetch(url);
    const blob = await response.blob();
    const { opfsWriteFile } = await import('./opfs');
    await opfsWriteFile(path, blob);
  }
};
