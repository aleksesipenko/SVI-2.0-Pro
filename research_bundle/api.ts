export const sviApi = {
  async renderNode(payload: {
    projectId: string;
    parentId: string | null;
    prompt: string;
    mode: 'T2V' | 'I2V';
    tier: string;
    anchorPngUrl?: string;
  }): Promise<{ taskId: string; nodeId: string }> {
    console.log("[API] Submitting Render Task:", payload);
    return {
      taskId: `tsk_${crypto.randomUUID()}`,
      nodeId: crypto.randomUUID()
    };
  }
};