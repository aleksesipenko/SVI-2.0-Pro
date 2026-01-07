
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2, Sparkles, X, Clapperboard, CheckCircle2, AlertTriangle, Wand2, ChevronRight, Layers, Play, StopCircle, RefreshCw, ArrowLeft, Users } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import MessageBubble from './MessageBubble';
import { Message, User, Attachment, ProjectPlan, Clip, Character, DirectorOption } from '../types';

interface ChatInterfaceProps {
  user: User;
  onBack?: () => void;
  selectedCharacter?: Character;
}

const SVI_DIRECTOR_SYSTEM_PROMPT = `
You are **SVI Prompt Director**, an expert assistant for Wan 2.2 video generation.
Current focus: SVI 2.0 Pro Workflow (FMLF - First-Middle-Last Frame).

TECHNICAL CONTEXT:
1. Every clip needs an "Anchor State" (previous clip's end) and a "Motion Delta".
2. You must enforce Character Invariants provided in the context.
3. Your goal is to produce a valid Clip Plan.

INTERACTION MODE:
- If the story reaches a turning point, provide **DirectorOption** cards.
- Format for options in text: [OPTION: Label | Description | Prompt Addon]
`;

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onBack, selectedCharacter }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Привет, ${user.name}! Я твой SVI Prompt Director. 🎬\n\nДавай подготовим проект. ${selectedCharacter ? `Я вижу, мы используем персонажа **${selectedCharacter.name}**. Я буду учитывать его портрет во всех промптах.` : 'Начнем с выбора режима и объекта.'}`,
      timestamp: Date.now(),
      suggestions: ['T2V, Horizontal, 10s', 'Cinematic Cyberpunk']
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);
  const [currentProject, setCurrentProject] = useState<ProjectPlan | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleOptionSelect = (option: DirectorOption) => {
    handleSendMessage(`Выбираю вариант: ${option.label}. ${option.prompt_addon}`);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if ((!textToSend.trim() && !selectedImage) || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
      attachments: selectedImage ? [selectedImage] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const charContext = selectedCharacter ? `ACTOR PORTRAIT: ${selectedCharacter.portrait}\n` : '';
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messages.concat(userMessage).map(m => ({
          role: m.role,
          parts: [
            ...(m.attachments?.[0]?.base64 ? [{ inlineData: { mimeType: 'image/png', data: m.attachments[0].base64 } }] : []),
            { text: m.content }
          ]
        })),
        config: {
          systemInstruction: charContext + SVI_DIRECTOR_SYSTEM_PROMPT,
        }
      });

      const responseText = response.text || "";
      
      // Parse Options [OPTION: Label | Description | Prompt Addon]
      const options: DirectorOption[] = [];
      const optionMatches = responseText.matchAll(/\[OPTION:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\]/gi);
      for (const match of optionMatches) {
        options.push({
          id: Math.random().toString(),
          label: match[1],
          description: match[2],
          prompt_addon: match[3]
        });
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText.replace(/\[OPTION:.*?\]/gi, '').trim(),
        timestamp: Date.now(),
        options: options.length > 0 ? options : undefined,
        suggestions: responseText.includes('Clip Plan') ? ['Launch Production 🚀'] : ['Horizontal 16:9', 'Dramatic Entry']
      };

      parseAIResponse(responseText);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("SVI Director Error:", error);
      setIsTyping(false);
    } finally {
      setIsTyping(false);
    }
  };

  const parseAIResponse = (text: string) => {
    // Simplified logic for MVP
    if (text.toLowerCase().includes('clip 1')) {
      setCurrentProject({
        summary: "Production based on director interaction.",
        bible: selectedCharacter?.portrait || "Standard consistency.",
        clips: [
          { index: 1, description: "Opening Scene", prompt: "Extracted Prompt 1...", status: 'pending' },
          { index: 2, description: "Action Shift", prompt: "Extracted Prompt 2...", status: 'pending' }
        ],
        negativePrompt: "blur, text, low quality",
        checklist: ["Identity lock active"]
      });
    }
  };

  const startGenerationSimulation = async () => {
    if (!currentProject || isGenerating) return;
    setIsGenerating(true);
    const updatedClips = [...currentProject.clips];
    for (let i = 0; i < updatedClips.length; i++) {
      updatedClips[i].status = 'generating';
      setCurrentProject(prev => prev ? { ...prev, clips: [...updatedClips] } : null);
      await new Promise(r => setTimeout(r, 2000));
      updatedClips[i].status = 'completed';
      setCurrentProject(prev => prev ? { ...prev, clips: [...updatedClips] } : null);
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex h-full bg-zinc-950 overflow-hidden animate-in fade-in duration-500">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative border-r border-zinc-800">
        <div className="h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
             {onBack && (
               <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                 <ArrowLeft className="w-4 h-4" /> Library
               </button>
             )}
             <div className="w-px h-6 bg-zinc-800 hidden sm:block" />
             <div className="flex items-center gap-2">
               <span className="text-xs font-black text-zinc-300 uppercase tracking-[0.2em]">Director Mode</span>
               {selectedCharacter && (
                 <div className="flex items-center gap-2 bg-purple-600/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                    <Users className="w-3 h-3 text-purple-400" />
                    <span className="text-[9px] font-black text-purple-300 uppercase">{selectedCharacter.name}</span>
                 </div>
               )}
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-48 scroll-smooth no-scrollbar">
          <div className="max-w-3xl mx-auto">
            {messages.map(m => (
              <div key={m.id}>
                <MessageBubble message={m} />
                
                {/* Option Cards */}
                {m.options && (
                  <div className="flex flex-col gap-3 mb-8 ml-14 animate-in slide-in-from-left-4 duration-500">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Director's Decision Required:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {m.options.map(opt => (
                        <button 
                          key={opt.id}
                          onClick={() => handleOptionSelect(opt)}
                          className="text-left bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 p-4 rounded-2xl transition-all group"
                        >
                          <h5 className="text-purple-400 font-black text-[11px] uppercase tracking-wider group-hover:text-purple-300">{opt.label}</h5>
                          <p className="text-zinc-500 text-[10px] mt-1 leading-relaxed">{opt.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {!isTyping && messages[messages.length - 1].suggestions && (
              <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar -mx-2 px-2">
                {messages[messages.length - 1].suggestions?.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => s.includes('Launch') ? startGenerationSimulation() : handleSendMessage(s)}
                    className="flex-shrink-0 px-5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-purple-400 hover:border-purple-500 hover:bg-purple-500/10 transition-all active:scale-95 shadow-2xl backdrop-blur-md"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {isTyping && (
              <div className="flex justify-start mb-8">
                <div className="bg-zinc-900 border border-zinc-800/80 px-6 py-4 rounded-3xl rounded-tl-none flex items-center gap-4 shadow-2xl">
                  <div className="w-5 h-5 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                  <span className="text-[12px] text-zinc-400 font-black uppercase tracking-[0.25em]">Directing Narrative...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Layer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative flex items-end gap-3 bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 rounded-[2rem] p-3 pl-5 shadow-2xl transition-all">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-zinc-500 hover:text-purple-400 transition-colors">
                <ImageIcon className="w-7 h-7" />
              </button>
              <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => { /* handle */ }} />
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Talk to SVI Director..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-white py-4 resize-none max-h-48 min-h-[56px] text-[15px] font-medium"
                rows={1}
              />
              <button type="submit" disabled={!input.trim() || isTyping} className="p-4 bg-purple-600 rounded-[1.5rem] text-white hover:bg-purple-500 disabled:opacity-20 shadow-xl shadow-purple-900/40">
                {isTyping ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Storyboard Sidebar */}
      <aside className="hidden xl:flex w-[420px] flex-col bg-zinc-950 border-l border-zinc-800/80">
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Clapperboard className="w-6 h-6 text-purple-500" />
            <span className="font-black text-xs uppercase tracking-[0.2em] text-zinc-100">Storyboard v2.1</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar scroll-smooth">
          {!currentProject ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30">
              <Clapperboard className="w-8 h-8 text-zinc-700 mb-6" />
              <p className="text-[12px] font-black text-zinc-600 uppercase tracking-[0.2em]">Awaiting Specs...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {currentProject.clips.map((clip) => (
                <div key={clip.index} className={`group relative bg-zinc-900/40 border rounded-2xl overflow-hidden transition-all duration-500 ${clip.status === 'generating' ? 'border-purple-500' : 'border-zinc-800/80'}`}>
                  <div className="p-4 bg-zinc-800/30 flex items-center justify-between">
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter opacity-80">PART {clip.index}</span>
                    {clip.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="p-5">
                    <p className="text-[12px] text-zinc-400 leading-relaxed font-medium italic italic">"{clip.prompt}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {currentProject && (
          <div className="p-6 border-t border-zinc-800 bg-zinc-900/60">
            <button onClick={startGenerationSimulation} className="w-full bg-white text-black font-black text-[11px] uppercase tracking-[0.25em] py-5 rounded-3xl flex items-center justify-center gap-3">
              <Play className="w-5 h-5 fill-current" /> Commit to Render
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};

export default ChatInterface;
