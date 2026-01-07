
import React, { useState } from 'react';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Clapperboard, 
  Clock, 
  User as UserIcon, 
  ChevronRight, 
  Trash2, 
  Copy,
  Sparkles
} from 'lucide-react';
import { Session } from '../types';

interface VisualHubProps {
  sessions: Session[];
  onSelect: (id: string) => void;
  onNew: () => void;
}

const VisualHub: React.FC<VisualHubProps> = ({ sessions, onSelect, onNew }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && (s.status === 'rendering' || s.status === 'draft')) ||
                         (filter === 'completed' && s.status === 'completed');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full flex flex-col p-6 lg:p-12 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 max-w-7xl mx-auto w-full">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-2 h-8 bg-purple-600 rounded-full" />
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Production</h2>
          </div>
          <p className="text-zinc-600 font-bold text-[10px] tracking-[0.4em] uppercase ml-5">Executive Dashboard • 2026</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-purple-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search library..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-64 transition-all"
            />
          </div>
          <button 
            onClick={onNew}
            className="flex items-center gap-3 bg-white text-black px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            New Sequence
          </button>
        </div>
      </div>

      {/* Filter Tabs - Brighter inactive states */}
      <div className="flex items-center gap-10 border-b border-zinc-900 mb-10 max-w-7xl mx-auto w-full">
        <FilterTab active={filter === 'all'} label="Everything" onClick={() => setFilter('all')} count={sessions.length} isPrimary />
        <FilterTab active={filter === 'active'} label="In Progress" onClick={() => setFilter('active')} count={sessions.filter(s => s.status !== 'completed').length} />
        <FilterTab active={filter === 'completed'} label="Finalized" onClick={() => setFilter('completed')} count={sessions.filter(s => s.status === 'completed').length} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full pb-32">
        {/* Large "Start New" Action Card */}
        {filter === 'all' && (
          <button 
            onClick={onNew}
            className="group relative aspect-video bg-gradient-to-br from-zinc-900 to-black border-2 border-dashed border-zinc-800/80 rounded-[2.5rem] flex flex-col items-center justify-center gap-5 hover:border-purple-500/50 hover:from-purple-900/5 transition-all duration-500 overflow-hidden shadow-2xl isolate transform-gpu"
          >
            <div className="w-20 h-20 rounded-3xl bg-zinc-950 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl border border-white/5">
               <Sparkles className="w-9 h-9 text-purple-500" />
            </div>
            <div className="text-center">
              <span className="block text-[9px] font-black text-purple-500/60 uppercase tracking-[0.5em] mb-1.5">Creative Suite</span>
              <span className="text-lg font-black text-zinc-400 uppercase tracking-tight group-hover:text-white transition-colors">Start New Film</span>
            </div>
          </button>
        )}

        {filteredSessions.map(session => (
          <div 
            key={session.id}
            onClick={() => onSelect(session.id)}
            className="group relative aspect-video bg-zinc-950 border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl cursor-pointer hover:scale-[1.01] hover:border-purple-500/30 transition-all duration-500 isolate transform-gpu"
          >
            {/* Background Image - Significant brightness increase (base 70%) */}
            {session.thumbnailUrl ? (
              <img 
                src={session.thumbnailUrl} 
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-110 grayscale-0 shadow-inner" 
                alt="" 
              />
            ) : (
               <div className="w-full h-full bg-zinc-900 flex items-center justify-center opacity-40">
                  <Clapperboard className="w-16 h-16 text-zinc-600" />
               </div>
            )}
            
            {/* Action Buttons - TOP RIGHT */}
            <div className="absolute top-6 right-6 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-8px] group-hover:translate-y-0 duration-300">
              <button 
                onClick={(e) => { e.stopPropagation(); }}
                className="p-3 bg-black/60 backdrop-blur-xl hover:bg-zinc-800 rounded-2xl border border-white/5 text-zinc-500 hover:text-white transition-all shadow-2xl active:scale-90"
                title="Duplicate Production"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); }}
                className="p-3 bg-black/60 backdrop-blur-xl hover:bg-red-500/20 rounded-2xl border border-white/5 text-zinc-500 hover:text-red-400 transition-all shadow-2xl active:scale-90"
                title="Move to Trash"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Content Overlay - Further lightened for better visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent p-8 flex flex-col justify-end">
              <div className="space-y-4 relative">
                
                {/* Character Badges Cluster */}
                {session.characterInvariants && (
                  <div className="flex -space-x-1.5 mb-1">
                    {session.characterInvariants.map((inv, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-xl transform group-hover:-translate-y-1 transition-transform overflow-hidden" style={{ transitionDelay: `${i * 50}ms` }}>
                        <UserIcon className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">{session.type} MODE</span>
                    <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                    
                    {/* Status integrated into content block */}
                    <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.2em] border ${
                      session.status === 'completed' ? 'border-green-500/40 text-green-400 bg-green-500/10' : 
                      session.status === 'rendering' ? 'border-purple-500/60 text-purple-300 bg-purple-500/20 animate-pulse' : 
                      'border-white/10 text-white/60 bg-black/40'
                    }`}>
                      {session.status}
                    </div>
                  </div>
                  
                  <h4 className="text-white font-black text-xl uppercase tracking-tight group-hover:text-purple-400 transition-colors leading-tight truncate drop-shadow-2xl">
                    {session.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                    <Clock className="w-3 h-3 text-purple-400" />
                    {new Date(session.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(session.lastUpdate).toLocaleDateString()}
                  </p>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:bg-purple-600/30">
                    <ChevronRight className="w-4 h-4 text-white group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FilterTab: React.FC<{ active: boolean, label: string, onClick: () => void, count: number, isPrimary?: boolean }> = ({ active, label, onClick, count, isPrimary }) => (
  <button 
    onClick={onClick}
    className={`pb-4 px-1 flex items-center gap-4 transition-all relative ${
      active 
        ? 'text-white' 
        : isPrimary 
          ? 'text-zinc-400 hover:text-zinc-200' 
          : 'text-zinc-500 hover:text-zinc-300'
    }`}
  >
    <span className="text-[10px] font-black uppercase tracking-[0.3em]">{label}</span>
    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
      active 
        ? 'bg-purple-600/20 text-purple-400' 
        : isPrimary 
          ? 'bg-zinc-800/50 text-zinc-500' 
          : 'bg-zinc-900/50 text-zinc-700'
    }`}>
      {count}
    </span>
    {active && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.4)]" />}
  </button>
);

export default VisualHub;
