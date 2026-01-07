
import React from 'react';
import { Video, Zap } from 'lucide-react';

interface HeaderProps {
  quotaUsed: number;
  quotaTotal: number;
}

const Header: React.FC<HeaderProps> = ({ quotaUsed, quotaTotal }) => {
  const percentage = (quotaUsed / quotaTotal) * 100;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/50 backdrop-blur-md px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Video className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          SVI 2.0 Pro
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span>Quota: {quotaUsed}/{quotaTotal} generations</span>
          </div>
          <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${percentage > 80 ? 'bg-red-500' : 'bg-purple-500'}`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        
        <button className="sm:hidden w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800">
          <Zap className="w-4 h-4 text-yellow-500" />
        </button>
      </div>
    </header>
  );
};

export default Header;
