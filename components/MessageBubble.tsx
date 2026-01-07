
import React from 'react';
import { Message } from '../types';
import { Video, User } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAi = message.role === 'model';

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      // Handle numeric lists (e.g. 1) or 1.)
      const isListItem = /^\d+[\)\.]/.test(line.trim());
      // Handle bullet lists
      const isBullet = /^\-/.test(line.trim());
      
      const formattedLine = line.split(/(\*\*.*?\*\*)/g).map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={partIdx} className="font-bold text-white shadow-sm tracking-tight">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      return (
        <div key={lineIdx} className={`${isListItem || isBullet ? 'pl-5 -indent-5 mb-2' : 'mb-2'}`}>
          {formattedLine}
        </div>
      );
    });
  };

  return (
    <div className={`flex w-full mb-8 ${isAi ? 'justify-start' : 'justify-end animate-in fade-in slide-in-from-right-4 duration-500'}`}>
      <div className={`flex max-w-[90%] sm:max-w-[85%] ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-1 shadow-2xl ${
          isAi ? 'bg-purple-600 mr-4 ring-2 ring-purple-500/30' : 'bg-zinc-800 ml-4 ring-2 ring-zinc-700/30'
        }`}>
          {isAi ? <Video className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-zinc-400" />}
        </div>
        
        <div className="flex flex-col">
          <div className={`px-5 py-4 rounded-2xl text-[14px] leading-relaxed tracking-wide shadow-2xl transition-all ${
            isAi 
              ? 'bg-zinc-900 text-zinc-300 rounded-tl-none border border-zinc-800/80 backdrop-blur-sm' 
              : 'bg-purple-600 text-white rounded-tr-none shadow-purple-900/40'
          }`}>
            {message.attachments && message.attachments.map((at, idx) => (
              <div key={idx} className="mb-4 rounded-xl overflow-hidden border border-white/5 shadow-inner bg-black/20">
                <img src={at.url} alt="Reference" className="w-full h-auto max-h-96 object-contain" />
              </div>
            ))}
            <div className="font-normal">
              {renderFormattedText(message.content)}
            </div>
          </div>
          <span className={`text-[10px] text-zinc-600 mt-2 font-black uppercase tracking-[0.15em] opacity-60 ${isAi ? 'text-left ml-1' : 'text-right mr-1'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {isAi ? 'Creative Director' : 'Executive Producer'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
