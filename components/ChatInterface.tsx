import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, 
  Plus, 
  X, 
  Video, 
  ArrowLeft, 
  Layout, 
  GitBranch, 
  Paperclip, 
  Users, 
  Camera, 
  Smile,
  Maximize,
  Aperture,
  Move,
  Settings2,
  Check,
  UploadCloud,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import MessageBubble from './MessageBubble';
import NarrativeCanvas from './NarrativeCanvas';
import { Message, User, StoryNode, Character, ViewMode, Attachment, DirectorOption, PromptDraft } from '../types';
import { db } from '../db';
import { opfsGetUrl } from '../opfs';
import { useTranslation } from 'react-i18next';

interface ChatInterfaceProps {
  user: User;
  projectId: string;
  onBack?: () => void;
  selectedCharacter?: Character;
}

interface ActiveTool {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: 'camera' | 'character';
}

// UPDATED SYSTEM PROMPT: Language enforcement + I2V Fast Track
const SVI_DIRECTOR_SYSTEM_PROMPT = `
You are **SVI Prompt Director**, an expert assistant for the **Stable Video Infinity (SVI) 2 Pro** workflow (Wan 2.2).

### LANGUAGE PROTOCOL (CRITICAL)
- **DETECT:** Analyze the user's input language (Russian or English).
- **MATCH:** YOU MUST REPLY IN THE EXACT SAME LANGUAGE AS THE USER.
- **DEFAULT:** If unsure, use **Russian**.

### FORMATTING RULES
- **NO MARKDOWN HEADERS:** Do NOT use '###' or '##'. Use **BOLD** for section titles.
- **NO TAG SOUP:** Use natural language sentences.

### WORKFLOW LOGIC
1. **SCENARIO A: IMAGE START (I2V)**
   - If the user provides an image FIRST:
   - **SKIP** the interview.
   - **ANALYZE** the image instantly.
   - **PROPOSE** 3 distinct "Director Trajectories" (Options) for a 15-second sequence based on the image.
   - Use the [OPTION] format defined below.

2. **SCENARIO B: TEXT START (T2V)**
   - If the user provides text ONLY:
   - **INTERVIEW:** Ask 2-3 key clarifying questions (Duration, Aspect Ratio, Mood).
   - **WAIT** for the user's answers.
   - **THEN** propose the 3 [OPTION] trajectories.

3. **PHASE 3: PRODUCTION (FINAL REVIEW)**
   - When an option is selected, output the **Prompt Draft** (\`[ANCHOR]\`, \`[DELTA]\`, \`[NEGATIVE]\`).

### OPTION FORMAT
- Use: \`[OPTION: Label | Description | Prompt Addon]\`
- Label: Short, punchy (2-4 words).
- Description: 1 sentence explaining the vibe/action.
- Prompt Addon: The technical T5 prompt segment.
`;

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, projectId, onBack, selectedCharacter }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [renderedTool, setRenderedTool] = useState<ActiveTool | null>(null);
  const [isToolExpanded, setIsToolExpanded] = useState(false);
  const [toolParams, setToolParams] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Sync renderedTool with activeTool and manage overflow timing
  useEffect(() => {
    if (activeTool) {
      setRenderedTool(activeTool);
      setIsSettingsOpen(false);
      const timer = setTimeout(() => setIsToolExpanded(true), 310);
      return () => clearTimeout(timer);
    } else {
      setIsToolExpanded(false);
      setIsSettingsOpen(false);
      const timer = setTimeout(() => setRenderedTool(null), 400);
      return () => clearTimeout(timer);
    }
  }, [activeTool]);

  useEffect(() => {
    loadProjectState();
  }, [projectId]);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, attachments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const loadProjectState = async () => {
    const savedNodes = await db.nodes.where('projectId').equals(projectId).sortBy('createdAt');
    const hydratedNodes = await Promise.all(savedNodes.map(async n => {
      if (n.assets.videoOpfsPath) {
         const url = await opfsGetUrl(n.assets.videoOpfsPath);
         return { ...n, assets: { ...n.assets, videoUrl: url } };
      }
      return n;
    }));
    setNodes(hydratedNodes);
    if (hydratedNodes.length > 0 && !selectedParentId) {
      setSelectedParentId(hydratedNodes[hydratedNodes.length - 1].id);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const processFiles = (files: File[]) => {
    const newAttachments: Attachment[] = [];
    let processedCount = 0;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          newAttachments.push({
            type: 'image',
            url: ev.target!.result as string
          });
        }
        processedCount++;
        if (processedCount === files.length) {
          // If we are in the "Start Screen" state (no messages), auto-send the image
          if (messages.length === 0) {
             handleStartScreenImage(newAttachments[0]);
          } else {
             setAttachments(prev => [...prev, ...newAttachments]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Special handler for the first image upload (I2V Start)
  const handleStartScreenImage = (attachment: Attachment) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: "I2V_START_TRIGGER", // Internal signal
      timestamp: Date.now(),
      attachments: [attachment]
    };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    generateAIResponse(newHistory);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const processResponse = (rawText: string) => {
    // 1. Extract Reasoning (Thought Process)
    const reasoningMatch = rawText.match(/<reasoning>([\s\S]*?)<\/reasoning>/);
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : undefined;
    
    // Remove reasoning from display text and TRIM immediately to prevent leading newlines
    let cleanContent = rawText.replace(/<reasoning>[\s\S]*?<\/reasoning>/, '').trim();

    // 2. Extract Options
    const options: DirectorOption[] = [];
    const optionRegex = /\[OPTION:\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\]/g;
    let optMatch;
    while ((optMatch = optionRegex.exec(cleanContent)) !== null) {
      options.push({
        id: crypto.randomUUID(),
        category: 'NARRATIVE',
        label: optMatch[1].trim(),
        description: optMatch[2].trim(),
        prompt_addon: optMatch[3].trim()
      });
    }
    // Remove options tags and TRIM again
    cleanContent = cleanContent.replace(optionRegex, '').trim();

    // 3. Extract Prompt Drafts (The Final Review Block)
    let promptDraft: PromptDraft | undefined;
    const anchorMatch = rawText.match(/\[ANCHOR\]([\s\S]*?)\[\/ANCHOR\]/);
    const deltaMatch = rawText.match(/\[DELTA\]([\s\S]*?)\[\/DELTA\]/);
    const negMatch = rawText.match(/\[NEGATIVE\]([\s\S]*?)\[\/NEGATIVE\]/);

    if (anchorMatch && deltaMatch) {
      promptDraft = {
        anchor: anchorMatch[1].trim(),
        delta: deltaMatch[1].trim(),
        negative: negMatch ? negMatch[1].trim() : "text, watermark, blur, low quality, distortion, morphing"
      };
      cleanContent = cleanContent
        .replace(/\[ANCHOR\][\s\S]*?\[\/ANCHOR\]/, '')
        .replace(/\[DELTA\][\s\S]*?\[\/DELTA\]/, '')
        .replace(/\[NEGATIVE\][\s\S]*?\[\/NEGATIVE\]/, '')
        .trim();
        
      if (!cleanContent) cleanContent = "Review the production manifest below.";
    }

    return { content: cleanContent, reasoning, options, promptDraft };
  };

  const generateAIResponse = async (history: Message[]) => {
    setIsTyping(true);
    const aiMessageId = crypto.randomUUID();
    
    // Add placeholder immediately for "Thinking" state
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now()
    }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const charContext = selectedCharacter ? `PROJECT_BIBLE: Character Invariants - ${selectedCharacter.portrait}\n` : '';
      
      const conversationHistory = history.map(m => {
        // Hide the internal trigger text
        const textContent = m.content === "I2V_START_TRIGGER" 
          ? "Here is the reference image for a new video sequence. Analyze it and propose 3 creative trajectories for a 15-second clip." 
          : (m.content || " ");

        const parts: any[] = [{ text: textContent }];
        if (m.attachments) {
          m.attachments.forEach(att => {
             const base64Data = att.url.split(',')[1];
             if (base64Data) {
               parts.push({
                 inlineData: {
                   mimeType: 'image/jpeg',
                   data: base64Data
                 }
               });
             }
          });
        }
        return {
          role: m.role === 'model' ? 'model' : 'user',
          parts: parts
        };
      });

      const stream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: conversationHistory,
        config: { 
          systemInstruction: charContext + SVI_DIRECTOR_SYSTEM_PROMPT,
        }
      });

      let accumulatedText = '';

      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          accumulatedText += c.text;
          const { content, reasoning, options, promptDraft } = processResponse(accumulatedText);
          
          setMessages(prev => prev.map(m => 
            m.id === aiMessageId 
              ? { ...m, content, reasoning, options: options.length > 0 ? options : undefined, promptDraft } 
              : m
          ));
        }
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => prev.map(m => 
        m.id === aiMessageId 
          ? { ...m, content: "Connection to Director interrupted. Please try again." } 
          : m
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const contentToSend = textOverride || input;
    if ((!contentToSend.trim() && attachments.length === 0) || isTyping) return;
    
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: contentToSend,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setAttachments([]);
    setActiveTool(null);
    setToolParams([]);
    
    await generateAIResponse(newHistory);
  };

  const handleOptionSelect = (option: DirectorOption) => {
    handleSendMessage(option.label);
  };

  const handleConfirmRender = (draft: PromptDraft) => {
    const msg = `Confirmed. Rendering node with:\nANCHOR: ${draft.anchor.substring(0, 30)}...\nDELTA: ${draft.delta.substring(0, 30)}...`;
    
    setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'user',
        content: "Render confirmed.",
        timestamp: Date.now()
    }, {
        id: crypto.randomUUID(),
        role: 'model',
        content: "Initiating SVI Cloud Render. Allocation ID: #TX-9921. You will be notified upon completion.",
        timestamp: Date.now()
    }]);
  };

  const handleRegenerate = async () => {
    if (messages.length === 0 || isTyping) return;
    const lastMsg = messages[messages.length - 1];
    let historyToUse = messages;

    if (lastMsg.role === 'model') {
      historyToUse = messages.slice(0, -1);
      setMessages(historyToUse);
    }

    if (historyToUse.length > 0 && historyToUse[historyToUse.length - 1].role === 'user') {
      await generateAIResponse(historyToUse);
    }
  };

  const toggleToolParam = (param: string) => {
    setToolParams(prev => prev.includes(param) ? prev.filter(p => p !== param) : [...prev, param]);
  };

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      processFiles(filesArray);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div 
      className="flex h-full bg-white dark:bg-[#212121] overflow-hidden relative"
      onDragEnter={handleDragEnter} 
      onDragLeave={handleDragLeave} 
      onDragOver={handleDragOver} 
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
          <div className="text-center p-10 border-2 border-dashed border-zinc-500 rounded-3xl">
            <UploadCloud className="w-20 h-20 text-white mx-auto mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-white">Release to Upload</h3>
            <p className="text-zinc-400 mt-2">Initialize Image-to-Video Workflow</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col relative w-full h-full">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 sticky top-0 z-20 bg-white/80 dark:bg-[#212121]/90 backdrop-blur-md border-b border-zinc-200 dark:border-white/5">
          <button onClick={onBack} className="p-2 hover:bg-zinc-100 dark:hover:bg-[#2f2f2f] rounded-lg text-zinc-500 dark:text-zinc-400 flex items-center gap-2 font-medium text-sm">
             <ArrowLeft className="w-4 h-4" /> <span>Latex Vision 2.0</span>
          </button>
          <div className="flex bg-zinc-100 dark:bg-[#2f2f2f] p-0.5 rounded-lg">
             <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-[#424242] shadow-sm text-black dark:text-white' : 'text-zinc-400'}`}><Layout className="w-4 h-4" /></button>
             <button onClick={() => setViewMode('canvas')} className={`p-1.5 rounded-md ${viewMode === 'canvas' ? 'bg-white dark:bg-[#424242] shadow-sm text-black dark:text-white' : 'text-zinc-400'}`}><GitBranch className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {viewMode === 'list' ? (
            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
              <div className="w-full max-w-4xl mx-auto p-4 pb-32 pt-8">
                {messages.length === 0 ? (
                  /* --- START CONSOLE: I2V / T2V Selection --- */
                  <div className="h-full flex flex-col items-center justify-center p-4 mt-10 animate-in fade-in duration-500">
                    <div className="w-24 h-24 bg-zinc-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-zinc-200 dark:border-white/10">
                        <Video className="w-10 h-10 text-zinc-400" />
                    </div>
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight text-center uppercase">
                      New Sequence
                    </h2>
                    <p className="text-zinc-500 text-sm max-w-md text-center leading-relaxed mb-10">
                      Initialize a new fluid reality stream. Upload a visual anchor for I2V or describe the scene for T2V.
                    </p>

                    <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* I2V Drop Zone */}
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative aspect-[4/3] rounded-2xl border-2 border-dashed border-zinc-300 dark:border-white/10 hover:border-purple-500 dark:hover:border-purple-500 bg-zinc-50 dark:bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-zinc-100 dark:hover:bg-white/10"
                      >
                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <ImageIcon className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">Image to Video</span>
                        <span className="text-[10px] text-zinc-500 mt-1">Drop Image or Click</span>
                      </div>

                      {/* T2V Prompt Focus */}
                      <button 
                        onClick={() => textareaRef.current?.focus()}
                        className="group relative aspect-[4/3] rounded-2xl border-2 border-dashed border-zinc-300 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 bg-zinc-50 dark:bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-zinc-100 dark:hover:bg-white/10"
                      >
                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Sparkles className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">Text to Video</span>
                        <span className="text-[10px] text-zinc-500 mt-1">Describe the Scene</span>
                      </button>
                    </div>
                  </div>
                ) : messages.map((m, idx) => (
                    <MessageBubble 
                        key={m.id} 
                        message={m} 
                        isStreaming={isTyping && m.id === messages[messages.length - 1].id && m.role === 'model'}
                        onOptionSelect={handleOptionSelect}
                        onRegenerate={idx === messages.length - 1 && m.role === 'model' ? handleRegenerate : undefined}
                        onRenderConfirm={handleConfirmRender}
                    />
                ))}
                {/* Remove the old bottom loading dots as we now use MessageBubble state */}
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : <NarrativeCanvas nodes={nodes} selectedNodeId={selectedParentId} onNodeSelect={setSelectedParentId} />}
        </div>

        {/* INPUT CAPSULE */}
        <div className="w-full bg-white dark:bg-[#212121]">
          <div className="max-w-3xl mx-auto px-4 pb-8">
            <div className="relative flex flex-col bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-[26px] overflow-visible border border-transparent dark:border-[#424242] focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-colors duration-300">
              
              {/* Attachment Preview Area */}
              {attachments.length > 0 && (
                <div className="flex gap-2 px-3 pt-3 overflow-x-auto no-scrollbar">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative group flex-shrink-0 animate-in fade-in zoom-in duration-200">
                      <img src={att.url} alt="attachment" className="h-16 w-16 object-cover rounded-xl border border-zinc-200 dark:border-white/10" />
                      <button 
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Main row: Plus + Text + Send */}
              <div className="flex items-end gap-3 p-3 min-h-[52px]">
                
                {/* Plus Button & Tool Selection Drop-up */}
                <div className="relative flex-shrink-0 mb-1" ref={menuRef}>
                  <div 
                    className={`absolute bottom-full left-0 mb-3 w-64 bg-[#2f2f2f] rounded-2xl shadow-2xl border border-[#424242] py-2 flex flex-col z-50 origin-bottom-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`}
                  >
                    <MenuItem 
                      icon={<Paperclip className="w-5 h-5" />} 
                      label="Upload File" 
                      onClick={() => { setIsMenuOpen(false); fileInputRef.current?.click(); }} 
                    />
                    <div className="h-px bg-[#424242] my-1.5 mx-2" />
                    <MenuItem icon={<Camera className="w-5 h-5" />} label="Camera Control" onClick={() => { setActiveTool({ id: 'cam', label: 'Camera Control', icon: <Camera className="w-4 h-4" />, type: 'camera' }); setIsMenuOpen(false); }} />
                    <MenuItem icon={<Users className="w-5 h-5" />} label="Link Character" onClick={() => { setActiveTool({ id: 'char', label: 'Link Actor', icon: <Users className="w-4 h-4" />, type: 'character' }); setIsMenuOpen(false); }} />
                  </div>
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#424242] transition-all ${isMenuOpen ? 'rotate-45 scale-110' : ''}`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  {/* Hidden File Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect} 
                    accept="image/*" 
                    multiple 
                  />
                </div>

                {/* Textarea */}
                <div className="flex-1 flex items-center py-2">
                  <textarea 
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Message Latex Vision..."
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-[16px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 resize-none leading-normal overflow-hidden scrollbar-none py-0 align-middle"
                    rows={1}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: '200px' }}
                  />
                </div>

                {/* Send Button */}
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={(!input.trim() && !attachments.length) || isTyping}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all mb-1 ${!input.trim() && !attachments.length ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95'}`}
                >
                  <ArrowUp className="w-5 h-5 stroke-[2.5px]" />
                </button>
              </div>

              {/* ACTIVE TOOLS AREA - With dynamic overflow to fix settings visibility */}
              <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeTool ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className={`${isToolExpanded ? 'overflow-visible' : 'overflow-hidden'}`}>
                  <div className="px-3 pb-3 flex items-center gap-2">
                    {renderedTool && (
                      <>
                        <button 
                          onClick={() => { setActiveTool(null); setToolParams([]); setIsSettingsOpen(false); }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 rounded-full text-[#3b82f6] hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-all group shadow-sm active:scale-95"
                        >
                          <div className="transition-transform group-hover:scale-110">{renderedTool.icon}</div>
                          <span className="text-[12px] font-bold whitespace-nowrap">{renderedTool.label}</span>
                          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <div className="relative" ref={settingsRef}>
                          <div 
                            className={`absolute bottom-full right-0 mb-3 w-56 bg-[#2f2f2f] rounded-2xl shadow-2xl border border-[#424242] py-2 flex flex-col z-50 origin-bottom-right transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSettingsOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`}
                          >
                            <div className="px-4 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{renderedTool.type === 'camera' ? 'Movement Modes' : 'Actor Traits'}</div>
                            {renderedTool.type === 'camera' ? (
                              <>
                                <SettingsItem label="WIDE SHOT" active={toolParams.includes('WIDE')} onClick={() => toggleToolParam('WIDE')} icon={<Maximize className="w-4 h-4" />} />
                                <SettingsItem label="CLOSE-UP" active={toolParams.includes('CLOSE-UP')} onClick={() => toggleToolParam('CLOSE-UP')} icon={<Aperture className="w-4 h-4" />} />
                                <SettingsItem label="ORBIT MOVE" active={toolParams.includes('ORBIT')} onClick={() => toggleToolParam('ORBIT')} icon={<Move className="w-4 h-4" />} />
                              </>
                            ) : (
                              <>
                                <SettingsItem label="HAPPY" active={toolParams.includes('HAPPY')} onClick={() => toggleToolParam('HAPPY')} icon={<Smile className="w-4 h-4" />} />
                                <SettingsItem label="SERIOUS" active={toolParams.includes('SERIOUS')} onClick={() => toggleToolParam('SERIOUS')} />
                                <SettingsItem label="ACTION" active={toolParams.includes('ACTION')} onClick={() => toggleToolParam('ACTION')} />
                              </>
                            )}
                          </div>
                          <button 
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isSettingsOpen ? 'bg-zinc-300 dark:bg-[#424242] text-zinc-900 dark:text-white scale-110' : 'bg-zinc-200 dark:bg-[#383838] text-zinc-500 dark:text-zinc-400 hover:opacity-100 hover:bg-zinc-300 dark:hover:bg-[#424242]'}`}
                          >
                            <Settings2 className={`w-4 h-4 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90' : ''}`} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Disclaimer */}
            <p className="text-center mt-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-80 select-none">
              Latex Vision can make mistakes. Verify your clips.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MenuItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#424242] text-left transition-all group active:bg-[#4a4a4a]">
    <div className="text-zinc-100 group-hover:scale-110 transition-transform">{icon}</div>
    <span className="text-sm font-medium text-zinc-100">{label}</span>
  </button>
);

const SettingsItem: React.FC<{ label: string, active: boolean, onClick: () => void, icon?: React.ReactNode }> = ({ label, active, onClick, icon }) => (
  <button onClick={onClick} className="flex items-center justify-between gap-3 w-full px-4 py-2.5 hover:bg-[#424242] text-left transition-all group active:bg-[#4a4a4a]">
    <div className="flex items-center gap-2">
      <div className={`transition-all ${active ? 'text-blue-400 scale-110' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{icon}</div>
      <span className={`text-xs font-bold uppercase tracking-wide transition-colors ${active ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{label}</span>
    </div>
    <div className={`transition-all duration-300 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
      <Check className="w-3.5 h-3.5 text-blue-400" />
    </div>
  </button>
);

export default ChatInterface;