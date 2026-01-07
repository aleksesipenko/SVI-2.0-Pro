import React, { useState } from 'react';
import { Message, DirectorOption, PromptDraft } from '../types';
import { Video, User, Brain, ChevronDown, ChevronRight, Copy, RefreshCw, Check, Play, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onOptionSelect?: (option: DirectorOption) => void;
  onRegenerate?: () => void;
  onRenderConfirm?: (draft: PromptDraft) => void;
}

const ThinkingIndicator = () => (
  <div className="flex items-center gap-1 h-6">
    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
  </div>
);

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming, onOptionSelect, onRegenerate, onRenderConfirm }) => {
  const { t } = useTranslation();
  const [isThinkingOpen, setIsThinkingOpen] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  
  // State for Editable Prompts in Review Mode
  const [editDraft, setEditDraft] = useState<PromptDraft | null>(null);

  const isAi = message.role === 'model';
  const hasReasoning = !!message.reasoning;
  const isReviewMode = !!message.promptDraft;
  const hasContent = !!message.content && message.content.trim().length > 0;
  
  // Is this the very beginning of an AI message where content is empty but we are streaming?
  const isThinkingState = isAi && !hasContent && isStreaming;

  // Initialize edit draft if in review mode
  React.useEffect(() => {
    if (message.promptDraft && !editDraft) {
      setEditDraft(message.promptDraft);
    }
  }, [message.promptDraft]);

  const handleCopy = async () => {
    if (message.content) {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Improved text formatter that handles markdown stars and hashes
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={lineIdx} className="h-2"></div>; // Small spacer for empty lines

      const isListItem = /^\d+[\)\.]/.test(trimmed) || /^\-/.test(trimmed);
      
      // Header Handling (###)
      if (trimmed.startsWith('###')) {
        return (
          <h3 key={lineIdx} className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mt-4 mb-2">
            {trimmed.replace(/^###\s*/, '')}
          </h3>
        );
      }

      // Robust split for **bold** that preserves the delimiters for mapping
      const parts = line.split(/(\*\*.*?\*\*)/g);
      
      const formattedLine = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={partIdx} className="font-bold text-zinc-900 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={partIdx}>{part}</span>;
      });

      return (
        <div key={lineIdx} className={`${isListItem ? 'pl-4 mb-2' : 'mb-3 last:mb-0'} leading-7 min-h-[1em] break-words`}>
          {formattedLine}
        </div>
      );
    });
  };

  // --- USER MESSAGE DESIGN ---
  if (!isAi) {
    if (message.content === "I2V_START_TRIGGER") return null; // Hide the internal trigger message

    return (
      <div className="flex w-full justify-end mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 group px-4">
        <div className="max-w-[85%] md:max-w-[70%] relative">
          <div className="bg-[#f4f4f4] dark:bg-[#2f2f2f] px-5 py-3 rounded-[26px] text-[15px] text-zinc-900 dark:text-zinc-100 shadow-sm">
            {message.attachments && message.attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {message.attachments.map((at, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border border-black/5 dark:border-white/5">
                    <img src={at.url} alt="Attachment" className="w-full h-auto object-cover" />
                  </div>
                ))}
              </div>
            )}
            <div className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- REVIEW MODE (Production Manifest) ---
  if (isReviewMode && editDraft) {
    return (
      <div className="flex w-full mb-10 gap-4 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500 px-4">
        <div className="w-full bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Manifest Header */}
          <div className="h-10 bg-zinc-100 dark:bg-black/40 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Production Manifest</span>
            </div>
            <div className="flex gap-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
               <span>Draft #1</span>
            </div>
          </div>

          {/* Editors */}
          <div className="p-6 space-y-6">
            
            {/* Anchor State */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Anchor State (Context)</label>
                <Edit3 className="w-3 h-3 text-zinc-500" />
              </div>
              <textarea 
                value={editDraft.anchor}
                onChange={(e) => setEditDraft({...editDraft, anchor: e.target.value})}
                className="w-full h-24 bg-zinc-50 dark:bg-[#252525] border border-zinc-200 dark:border-white/5 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none leading-relaxed font-medium"
              />
            </div>

            {/* Motion Delta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">Motion Delta (Action)</label>
                <Edit3 className="w-3 h-3 text-zinc-500" />
              </div>
              <textarea 
                value={editDraft.delta}
                onChange={(e) => setEditDraft({...editDraft, delta: e.target.value})}
                className="w-full h-24 bg-zinc-50 dark:bg-[#252525] border border-zinc-200 dark:border-white/5 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none leading-relaxed font-medium"
              />
            </div>

            {/* Technical Footer */}
            <div className="grid grid-cols-2 gap-4 pt-2">
               <div className="p-3 bg-zinc-50 dark:bg-[#252525] rounded-xl border border-zinc-200 dark:border-white/5">
                  <span className="block text-[8px] font-black uppercase tracking-wider text-zinc-400 mb-1">Negative Prompt</span>
                  <input 
                    value={editDraft.negative}
                    onChange={(e) => setEditDraft({...editDraft, negative: e.target.value})}
                    className="w-full bg-transparent text-xs text-zinc-500 dark:text-zinc-400 focus:outline-none truncate"
                  />
               </div>
               <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => onRenderConfirm && onRenderConfirm(editDraft)}
                    className="h-full px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Launch Render
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARD AI MESSAGE (Chat + Options) ---
  return (
    <div className="flex w-full mb-8 gap-4 max-w-4xl mx-auto animate-in fade-in duration-500 group px-4">
      {/* AI Avatar */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center bg-white dark:bg-transparent shadow-sm">
          <Video className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0 pt-1">
        {/* Thinking / Reasoning Block */}
        {hasReasoning && (
          <div className="mb-3">
            <button 
              onClick={() => setIsThinkingOpen(!isThinkingOpen)}
              className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors select-none"
            >
              {isThinkingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <Brain className="w-3.5 h-3.5" />
              <span className={`${isStreaming && !message.content ? 'animate-pulse' : ''}`}>
                {isStreaming && !message.content ? "Thinking..." : "Thought Process"}
              </span>
            </button>
            
            {isThinkingOpen && (
              <div className="mt-2 ml-1 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 animate-in fade-in slide-in-from-top-1 duration-300">
                <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed opacity-90">
                  {message.reasoning}
                  {isStreaming && !message.content && (
                    <span className="inline-block w-1.5 h-3 ml-1 bg-zinc-400 align-middle animate-pulse"/>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main Text Content - Only render if content exists OR we are "Thinking" */}
        {(hasContent || isThinkingState) && (
          <div className="text-[15px] text-zinc-900 dark:text-zinc-100 font-normal">
            {isThinkingState ? (
              <ThinkingIndicator />
            ) : (
              <>
                {renderFormattedText(message.content)}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-zinc-900 dark:bg-zinc-100 align-middle animate-pulse rounded-sm"/>
                )}
              </>
            )}
          </div>
        )}

        {/* Director Options (Interactive Cards) */}
        {message.options && message.options.length > 0 && !isStreaming && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {message.options.map((opt, idx) => (
              <button
                key={opt.id}
                onClick={() => onOptionSelect && onOptionSelect(opt)}
                className="group relative flex flex-col items-center justify-end text-center p-6 h-64 rounded-2xl border-2 border-zinc-200 dark:border-white/10 hover:border-red-500/50 dark:hover:border-red-500/80 transition-all bg-white dark:bg-[#1a1a1a] shadow-lg hover:shadow-red-500/10 overflow-hidden active:scale-[0.98]"
              >
                {/* Background Decor - Simulating a "Poster" look */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 p-3 opacity-30 group-hover:opacity-100 transition-opacity z-20">
                   <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                   </div>
                </div>

                <div className="relative z-20 flex flex-col items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-red-400 transition-colors">
                    15s Sequence
                  </span>
                  <span className="text-lg font-black text-zinc-900 dark:text-white uppercase leading-tight group-hover:text-red-500 transition-colors">
                    {opt.label}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug max-w-[180px] opacity-80 group-hover:opacity-100 group-hover:text-white transition-all">
                    {opt.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Message Actions Footer (Copy, Retry, etc) */}
        {!isStreaming && !isReviewMode && hasContent && (
          <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button 
              onClick={handleCopy}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800" 
              title="Copy"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {onRegenerate && (
              <button 
                onClick={onRegenerate}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800" 
                title="Regenerate"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;