import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Clock, 
  Trash2, 
  Copy,
  Sparkles,
  Film,
  Activity,
  Play
} from 'lucide-react';
import { Session } from '../types';
import { useTranslation } from 'react-i18next';

interface VisualHubProps {
  sessions: Session[];
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

const VisualHub: React.FC<VisualHubProps> = ({ sessions, onSelect, onNew, onDelete }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'trash'>('all');

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'trash') return matchesSearch && s.deletedAt;
    if (s.deletedAt) return false;
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && (s.status === 'rendering' || s.status === 'draft')) ||
                         (filter === 'completed' && s.status === 'completed');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full flex flex-col p-6 lg:p-8 overflow-y-auto no-scrollbar bg-white dark:bg-[#212121]">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 max-w-6xl mx-auto w-full">
        <div>
           <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{t('production_dashboard')}</h2>
           <p className="text-zinc-500 text-xs mt-1">{t('exec_dashboard')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder={t('search_library')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 bg-zinc-50 dark:bg-[#2f2f2f] border border-zinc-200 dark:border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-900 dark:text-white focus:outline-none transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-white/5 mb-8 max-w-6xl mx-auto w-full overflow-x-auto no-scrollbar">
        <FilterTab active={filter === 'all'} label={t('filter_everything')} onClick={() => setFilter('all')} count={sessions.filter(s => !s.deletedAt).length} />
        <FilterTab active={filter === 'active'} label={t('filter_progress')} onClick={() => setFilter('active')} count={sessions.filter(s => !s.deletedAt && (s.status !== 'completed')).length} />
        <FilterTab active={filter === 'completed'} label={t('filter_finalized')} onClick={() => setFilter('completed')} count={sessions.filter(s => !s.deletedAt && s.status === 'completed').length} />
        <FilterTab active={filter === 'trash'} label={t('filter_trash')} onClick={() => setFilter('trash')} count={sessions.filter(s => s.deletedAt).length} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full pb-20">
        {filter === 'all' && (
          <button 
            onClick={onNew}
            className="group relative aspect-video bg-[#f9f9f9] dark:bg-[#2f2f2f]/50 border border-dashed border-zinc-300 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all hover:border-zinc-400 dark:hover:border-white/30"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black shadow-lg">
               <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('start_new_film')}</span>
          </button>
        )}

        {filteredSessions.map((session) => (
          <ProjectCard 
            key={session.id} 
            session={session} 
            onSelect={onSelect} 
            onDelete={onDelete}
            t={t} 
          />
        ))}
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{ session: Session, onSelect: (id: string) => void, onDelete: (id: string) => void, t: any }> = ({ session, onSelect, onDelete, t }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      onClick={() => onSelect(session.id)}
      className="group relative aspect-video bg-zinc-50 dark:bg-[#2f2f2f] border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-zinc-400 dark:hover:border-white/20 transition-all shadow-sm hover:shadow-md"
    >
      {!imgError && session.thumbnailUrl ? (
        <img 
          src={session.thumbnailUrl} 
          className="w-full h-full object-cover opacity-90 transition-all duration-700 group-hover:scale-105" 
          alt={session.title}
          onError={() => setImgError(true)}
        />
      ) : (
         <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700">
            <Film className="w-8 h-8" />
         </div>
      )}
      
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
         <div className="px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-md text-[8px] font-bold text-white uppercase tracking-widest border border-white/10">
            {session.type}
         </div>
         {session.status === 'rendering' && (
            <div className="px-1.5 py-0.5 rounded bg-zinc-900/60 backdrop-blur-md text-[8px] font-bold text-white uppercase tracking-widest border border-white/10 flex items-center gap-1">
               <Activity className="w-2 h-2 text-green-400 animate-pulse" />
               LIVE
            </div>
         )}
      </div>

      <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
          className="p-1.5 bg-white/90 dark:bg-black/60 rounded-lg text-zinc-900 dark:text-white hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
        <h4 className="text-white font-bold text-sm truncate mb-1">
          {session.title}
        </h4>
        <div className="flex items-center gap-3 text-zinc-400 text-[9px] font-medium">
           <div className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              <span>{new Date(session.lastUpdate).toLocaleDateString()}</span>
           </div>
           {session.status === 'completed' && <Play className="w-2.5 h-2.5 text-white/60" />}
        </div>
      </div>
    </div>
  );
};

const FilterTab: React.FC<{ active: boolean, label: string, onClick: () => void, count: number }> = ({ active, label, onClick, count }) => (
  <button 
    onClick={onClick}
    className={`pb-3 px-1 flex items-center gap-2 transition-all relative shrink-0 ${
      active ? 'text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
    }`}
  >
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    <span className="text-[9px] font-mono opacity-60">{count}</span>
  </button>
);

export default VisualHub;