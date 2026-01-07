
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2, Clapperboard, CheckCircle2, Play, ArrowLeft, Users, GitBranch, Layout, Sparkles, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import MessageBubble from '../components/MessageBubble';
import { Message, User, StoryNode, Character, DirectorOption, RenderStage } from '../types';
import { db } from '../db';
import { opfsGetUrl } from '../opfs';
import { sviApi } from '../api';

interface ChatInterfaceProps {
  user: User;
  projectId: string;
  onBack?: () => void;
  selectedCharacter?: Character;
}

const SVI_DIRECTOR_SYSTEM_PROMPT = `
You are **SVI Prompt Director**. 
Current focus: SVI 2.0 Pro Workflow (FMLF - First-Middle-Last Frame).

TECHNICAL CONTEXT (Phase 6):
1. Every clip needs an "Anchor State" (previous clip's end) and a "Motion Delta".
2. If this is an extension (I2V), start with a detailed description of the last frame.
3. Keep prompts within 80-120 words for Wan 2.2 T5 adherence.

OUTPUT CONTRACT:
- Restate Project Bible invariants if changed.
- Write one English prompt in "State + Motion" structure.
- Provide options for story turns: [OPTION: Label | Description | Prompt Addon]
`;

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, projectId, onBack, selectedCharacter }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [activeTasks, setActiveTasks] = useState<Record<string, string>>({}); // taskId -> nodeId
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSession = async () => {
      const savedNodes = await db.nodes.where('projectId').equals(projectId).sortBy('createdAt');
      
      const hydrated = await Promise.all(savedNodes.map(async n => {
        if (n.assets.videoOpfsPath) {
           const url = await opfsGetUrl(n.assets.videoOpfsPath);
           return { ...n, assets: { ...n.assets, videoUrl: url } };
        }
        return n;
      }));

      setNodes(hydrated);
      if (hydrated.length > 0) setSelectedParentId(hydrated[hydrated.length - 1].id);

      if (hydrated.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'model',
          content: `Привет, ${user.name}! Я ваш SVI Director. Мы находимся в консоли Фазы 6 (Pro Pipeline). Какую сцену будем рендерить первой?`,
          timestamp: Date.now(),
          suggestions: ['Киберпанк-детектив в неоновом дожде', 'Сюрреалистичный сад кристаллов']
        }]);
      }
    };
    loadSession();
  }, [projectId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      for (const [taskId, nodeId] of Object.entries(activeTasks)) {
        try {
          const node = await db.nodes.get(nodeId);
          if (!node) continue;

          let nextPct = (node.progress || 0) + 5;
          let nextStage: RenderStage = node.renderStage || 'QUEUED';

          if (nextPct < 20) nextStage = 'LOADING';
          else if (nextPct < 80) nextStage = 'SAMPLING';
          else if (nextPct < 100) nextStage = 'UPLOADING';
          else nextStage = 'DONE';

          if (nextPct >= 100) {
            await db.nodes.update(nodeId, { 
              status: 'completed', 
              renderStage: 'DONE', 
              progress: 100,
              assets: { ...node.assets, videoUrl: 'https://cdn.svipro.ai/mock/demo_clip.mp4' } 
            });
            
            const updated = await db.nodes.get(nodeId);
            setNodes(prev => prev.map(n => n.id === nodeId ? updated! : n));
            
            const newTasks = { ...activeTasks };
            delete newTasks[taskId];
            setActiveTasks(newTasks);
            
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'model',
              content: `🎬 Рендеринг узла **Node ${node.index + 1}** успешно завершен.`,
              timestamp: Date.now(),
              suggestions: ['Продолжить историю 🚀', 'Изменить параметры']
            }]);
          } else {
            await db.nodes.update(nodeId, { progress: nextPct, renderStage: nextStage });
            setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, progress: nextPct, renderStage: nextStage } : n));
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeTasks]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isTyping) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const charContext = selectedCharacter ? `PROJECT_BIBLE: Character Invariants - ${selectedCharacter.portrait}\n` : '';
      
      const conversationHistory = messages
        .filter((m, idx) => !(idx === 0 && m.role === 'model'))
        .concat(userMessage)
        .map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: conversationHistory,
        config: { systemInstruction: charContext + SVI_DIRECTOR_SYSTEM_PROMPT }
      });

      const responseText = response.text || "";
      const options = parseOptions(responseText);

      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: responseText.replace(/\[OPTION:.*?\]/gi, '').trim(),
        timestamp: Date.now(),
        options: options.length > 0 ? options : undefined,
      };

      setMessages(prev => [...prev, aiResponse]);
      
      const promptMatch = responseText.match(/prompt:\s*"(.*?)"/i);
      if (promptMatch) {
         setMessages(prev => prev.map(m => m.id === aiResponse.id ? { ...m, suggestions: ['Launch Professional Render 🚀'] } : m));
      }

    } catch (error) {
      console.error("Director Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const parseOptions = (text: string): DirectorOption[] => {
    const options: DirectorOption[] = [];
    const matches = text.matchAll(/\[OPTION:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\]/gi);
    for (const match of matches) {
      options.push({ 
        id: crypto.randomUUID(), 
        category: 'NARRATIVE', // Default category
        label: match[1], 
        description: match[2], 
        prompt_addon: match[3] 
      });
    }
    return options;
  };

  return null; // Implementation copy for research logic reference only
};

export default ChatInterface;
