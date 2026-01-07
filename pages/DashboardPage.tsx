
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import ChatInterface from '../components/ChatInterface';
import VisualHub from '../components/VisualHub';
import CastManager from '../components/CastManager';
import { User, NavigationTab, Session, Character } from '../types';
import { 
  MessageSquare, 
  User as UserIcon, 
  LogOut, 
  Zap, 
  Users,
  LayoutGrid
} from 'lucide-react';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.CHAT);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  // Load persistence
  useEffect(() => {
    const savedSessions = localStorage.getItem('svi_sessions');
    const savedChars = localStorage.getItem('svi_characters');
    
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    else {
      // Mock initial
      const mock = [
        { id: 's1', title: 'Cyberpunk Runner', lastUpdate: Date.now(), status: 'completed', type: 'T2V', thumbnailUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80' }
      ];
      setSessions(mock as Session[]);
    }

    if (savedChars) setCharacters(JSON.parse(savedChars));
  }, []);

  const saveCharacters = (newChars: Character[]) => {
    setCharacters(newChars);
    localStorage.setItem('svi_characters', JSON.stringify(newChars));
  };

  const closeSession = () => setSelectedSessionId(null);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col h-screen overflow-hidden">
      <Header quotaUsed={user.quota.used} quotaTotal={user.quota.total} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-zinc-800 flex-col p-4 bg-zinc-950/50">
          <div className="space-y-4 mb-8 px-2 mt-4">
             <div className="flex items-center gap-3">
                <div className="w-2 h-5 bg-purple-600 rounded-full" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Studio Console</span>
             </div>
          </div>
          
          <div className="space-y-2 flex-1">
            <SidebarItem 
              icon={<LayoutGrid className="w-5 h-5" />} 
              label="Productions" 
              active={activeTab === NavigationTab.CHAT}
              onClick={() => { setActiveTab(NavigationTab.CHAT); closeSession(); }}
            />
            <SidebarItem 
              icon={<Users className="w-5 h-5" />} 
              label="Cast & Portraits" 
              active={activeTab === NavigationTab.CAST}
              onClick={() => setActiveTab(NavigationTab.CAST)}
            />
            <SidebarItem 
              icon={<UserIcon className="w-5 h-5" />} 
              label="Profile" 
              active={activeTab === NavigationTab.PROFILE}
              onClick={() => setActiveTab(NavigationTab.PROFILE)}
            />
          </div>

          <div className="pt-4 border-t border-zinc-800/60">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-3 text-zinc-500 hover:text-red-400 rounded-2xl transition-all">
              <LogOut className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden relative">
          {activeTab === NavigationTab.CHAT && (
            !selectedSessionId ? (
              <VisualHub 
                sessions={sessions} 
                onSelect={(id) => setSelectedSessionId(id)} 
                onNew={() => setSelectedSessionId('new')} 
              />
            ) : (
              <ChatInterface user={user} onBack={closeSession} selectedCharacter={characters[0]} />
            )
          )}
          
          {activeTab === NavigationTab.CAST && (
            <CastManager characters={characters} onUpdate={saveCharacters} />
          )}

          {activeTab === NavigationTab.PROFILE && (
            <div className="h-full overflow-y-auto">
              <ProfileView user={user} />
            </div>
          )}
        </main>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${active ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'text-zinc-500 hover:bg-zinc-800/30 hover:text-zinc-200 border border-transparent'}`}
  >
    {icon}
    <span className="font-bold text-xs uppercase tracking-widest">{label}</span>
  </button>
);

const ProfileView: React.FC<{ user: User }> = ({ user }) => (
  <div className="p-8 pb-32 max-w-4xl mx-auto animate-in fade-in duration-700">
    <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-8">Executive Profile</h2>
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8">
       <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Producer</p>
            <p className="text-lg font-bold text-white">{user.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Tier</p>
            <p className="text-lg font-bold text-purple-400 uppercase">{user.tier} ACCESS</p>
          </div>
       </div>
    </div>
  </div>
);

export default DashboardPage;
