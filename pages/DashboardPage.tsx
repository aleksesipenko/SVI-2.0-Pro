import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import ChatInterface from '../components/ChatInterface';
import VisualHub from '../components/VisualHub';
import CastManager from '../components/CastManager';
import { User, NavigationTab, Project, Character } from '../types';
import { db } from '../db';
import { 
  LogOut, 
  Users,
  LayoutGrid,
  Plus,
  Settings,
  Shield,
  HardDrive,
  CreditCard,
  Trash2,
  Download,
  ChevronRight,
  Monitor,
  Activity,
  Key,
  ShieldCheck,
  Zap,
  Globe,
  Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.CHAT);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    const loadData = async () => {
      let savedProjects = await db.projects.toArray();
      let savedChars = await db.characters.orderBy('lastUsed').reverse().toArray();
      
      if (savedProjects.length === 0) {
        const seedProjects: Project[] = [
          {
            id: 'p1',
            title: 'Neon Tokyo Rain',
            description: 'Cyberpunk cinematic sequence',
            lastUpdate: Date.now(),
            status: 'completed',
            type: 'T2V',
            thumbnailUrl: 'https://images.unsplash.com/photo-1542641728-6ca359b085f4?auto=format&fit=crop&q=80&w=640',
            invariants: {}
          }
        ];
        await db.projects.bulkAdd(seedProjects);
        savedProjects = seedProjects;
      }

      if (savedChars.length === 0) {
        const seedChars: Character[] = [
          {
            id: 'c1',
            name: 'Kaelith',
            portrait: JSON.stringify({
              name: "Kaelith",
              identity: { gender: "Female", age: "24", species: "High Elf", archetype: "Mage" },
              appearance: { features: "Glowing tattoos", hair: "Platinum", hairstyle: "Long braided", eyes: "Emerald Green", build: "Slender, chest: moderate, butt: defined" },
              wardrobe: { description: "Silk and leather mage robes", accessories: "Crystal staff" },
              vibe: { mood: "Focused", style: "Elegant" },
              special: { distinctive_features: "Runic birthmarks", behavior: "Speaks with an echo", likes: "Ancient libraries" }
            }),
            tags: ['fantasy', 'elf'],
            lastUsed: Date.now()
          }
        ];
        await db.characters.bulkAdd(seedChars);
        savedChars = seedChars;
      }

      setProjects(savedProjects.sort((a, b) => b.lastUpdate - a.lastUpdate));
      setCharacters(savedChars);
    };
    loadData();
  }, []);

  const saveCharacters = async (newChars: Character[]) => {
    setCharacters(newChars);
    await db.characters.clear();
    await db.characters.bulkAdd(newChars);
  };

  const closeProject = () => setSelectedProjectId(null);

  const handleOpenProject = (id: string) => {
    setActiveTab(NavigationTab.CHAT);
    setSelectedProjectId(id);
  };

  const handleCreateProject = async () => {
    const newProj: Project = {
      id: crypto.randomUUID(),
      title: 'New Sequence',
      description: '',
      lastUpdate: Date.now(),
      status: 'draft',
      type: 'T2V',
      invariants: {}
    };
    await db.projects.add(newProj);
    setProjects(prev => [newProj, ...prev]);
    setSelectedProjectId(newProj.id);
  };

  const handleDeleteProject = async (id: string) => {
    const p = projects.find(proj => proj.id === id);
    if (!p) return;
    if (p.deletedAt) {
        if (window.confirm(t('delete_forever_confirm'))) {
            await db.projects.delete(id);
            setProjects(prev => prev.filter(item => item.id !== id));
        }
    } else {
        const now = Date.now();
        await db.projects.update(id, { deletedAt: now });
        setProjects(prev => prev.map(item => item.id === id ? { ...item, deletedAt: now } : item));
    }
  };

  const recentProjects = projects.filter(p => !p.deletedAt).slice(0, 5);

  return (
    <div className="min-h-screen bg-white dark:bg-[#171717] flex flex-col h-screen overflow-hidden transition-colors">
      <Header quotaUsed={user.quota.used} quotaTotal={user.quota.total} />

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="hidden md:flex w-64 border-r border-zinc-200 dark:border-white/5 flex-col p-3 bg-[#f9f9f9] dark:bg-[#171717] overflow-y-auto no-scrollbar">
          
          <button
            onClick={() => { setActiveTab(NavigationTab.CHAT); setSelectedProjectId(null); handleCreateProject(); }}
            className="w-full flex items-center justify-between px-3 py-3 mb-6 rounded-lg hover:bg-zinc-200 dark:hover:bg-[#2f2f2f] transition-all group shrink-0 border border-zinc-200 dark:border-white/10"
          >
            <div className="flex items-center gap-3">
               <Plus className="w-4 h-4 text-zinc-900 dark:text-white" />
               <span className="font-semibold text-sm text-zinc-900 dark:text-white">{t('new_sequence')}</span>
            </div>
          </button>
          
          <div className="space-y-1 flex-1">
            <SidebarItem 
              icon={<LayoutGrid className="w-4 h-4" />} 
              label={t('productions')} 
              active={activeTab === NavigationTab.CHAT && !selectedProjectId}
              onClick={() => { setActiveTab(NavigationTab.CHAT); closeProject(); }}
            />

            <div className="mt-6 mb-2 px-3">
               <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">TIMELINE</span>
            </div>

            <div className="flex flex-col relative mb-4">
               {recentProjects.map((p) => {
                 const isActive = selectedProjectId === p.id && activeTab === NavigationTab.CHAT;
                 return (
                   <button
                     key={p.id}
                     onClick={() => handleOpenProject(p.id)}
                     className={`group relative px-3 py-2 flex items-center gap-3 text-left transition-all duration-200 w-full rounded-lg ${isActive ? 'bg-zinc-200 dark:bg-[#2f2f2f]' : 'hover:bg-zinc-100 dark:hover:bg-[#212121]'}`}
                   >
                     <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                     <span className={`truncate text-xs font-medium ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                       {p.title}
                     </span>
                   </button>
                 );
               })}
            </div>

            <SidebarItem 
              icon={<Users className="w-4 h-4" />} 
              label={t('cast_portraits')} 
              active={activeTab === NavigationTab.CAST}
              onClick={() => setActiveTab(NavigationTab.CAST)}
            />
            <SidebarItem 
              icon={<Settings className="w-4 h-4" />} 
              label={t('profile')} 
              active={activeTab === NavigationTab.PROFILE}
              onClick={() => setActiveTab(NavigationTab.PROFILE)}
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-white/5 mt-auto">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-all text-sm font-medium">
              <LogOut className="w-4 h-4" />
              <span>{t('sign_out')}</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden relative bg-white dark:bg-[#212121]">
          <div key={activeTab + (selectedProjectId || '')} className="h-full w-full animate-in fade-in duration-300 ease-out">
            {activeTab === NavigationTab.CHAT && (
              !selectedProjectId ? <VisualHub sessions={projects as any} onSelect={(id) => setSelectedProjectId(id)} onNew={handleCreateProject} onDelete={handleDeleteProject} /> : 
              <ChatInterface user={user} projectId={selectedProjectId} onBack={closeProject} selectedCharacter={characters[0]} />
            )}
            
            {activeTab === NavigationTab.CAST && <CastManager characters={characters} onUpdate={saveCharacters} />}

            {activeTab === NavigationTab.PROFILE && <SettingsManager user={user} />}
          </div>
        </main>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all mb-0.5 ${active ? 'bg-zinc-200 dark:bg-[#2f2f2f] text-zinc-900 dark:text-white font-semibold' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#212121] hover:text-zinc-900 dark:hover:text-white'}`}>
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

const SettingsManager: React.FC<{ user: User }> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<'general' | 'account' | 'billing' | 'data'>('general');
  const [isResettingKey, setIsResettingKey] = useState(false);
  const [showKeyResetSuccess, setShowKeyResetSuccess] = useState(false);

  const clearOPFS = async () => {
    if (window.confirm(t('cache_desc'))) {
      try {
        const root = await navigator.storage.getDirectory();
        // @ts-ignore - entries() is part of the standard but types might lag
        for await (const [name] of root.entries()) {
          await root.removeEntry(name, { recursive: true });
        }
        alert(t('cache_purged'));
      } catch (err) {
        console.error("Cleanup failed:", err);
      }
    }
  };

  const exportRealityGraph = async () => {
    const projects = await db.projects.toArray();
    const nodes = await db.nodes.toArray();
    const characters = await db.characters.toArray();
    
    const archive = {
      version: "2.6.0",
      timestamp: Date.now(),
      producer: user.id,
      data: { projects, nodes, characters }
    };

    const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LATEX_VISION_ARCHIVE_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert(t('export_ready'));
  };

  const handleKeyReset = () => {
    setIsResettingKey(true);
    setTimeout(() => {
      setIsResettingKey(false);
      setShowKeyResetSuccess(true);
      setTimeout(() => setShowKeyResetSuccess(false), 3000);
    }, 1500);
  };

  const quotaPercent = (user.quota.used / user.quota.total) * 100;

  return (
    <div className="h-full flex flex-col md:flex-row max-w-5xl mx-auto w-full p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto no-scrollbar">
      
      <div className="w-full md:w-64 space-y-1 mb-8 md:mb-0 md:mr-12 shrink-0">
        <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-6 uppercase tracking-wider">{t('profile')}</h2>
        <SettingsTab active={tab === 'general'} icon={<Monitor className="w-4 h-4" />} label={t('tab_general')} onClick={() => setTab('general')} />
        <SettingsTab active={tab === 'account'} icon={<Shield className="w-4 h-4" />} label={t('tab_account')} onClick={() => setTab('account')} />
        <SettingsTab active={tab === 'billing'} icon={<CreditCard className="w-4 h-4" />} label={t('tab_billing')} onClick={() => setTab('billing')} />
        <SettingsTab active={tab === 'data'} icon={<HardDrive className="w-4 h-4" />} label={t('tab_data')} onClick={() => setTab('data')} />
      </div>

      <div className="flex-1 space-y-10 pb-32">
        
        {tab === 'general' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <SettingRow label={t('setting_language')}>
               <div className="flex bg-zinc-100 dark:bg-[#2f2f2f] p-1 rounded-xl border border-zinc-200 dark:border-white/5">
                  {['en', 'ru'].map(l => (
                    <button key={l} onClick={() => i18n.changeLanguage(l)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${i18n.language === l ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                      {l}
                    </button>
                  ))}
               </div>
            </SettingRow>

            <SettingRow label={t('setting_theme')}>
               <ThemeToggle />
            </SettingRow>

            <SettingRow label={t('setting_density')}>
               <select className="bg-zinc-100 dark:bg-[#2f2f2f] border-zinc-200 dark:border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-zinc-400 appearance-none min-w-[140px] text-center cursor-pointer">
                  <option>{t('density_comfortable')}</option>
                  <option>{t('density_compact')}</option>
               </select>
            </SettingRow>
          </div>
        )}

        {tab === 'account' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-zinc-50 dark:bg-[#2f2f2f] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 flex items-center gap-6">
               <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-black font-black text-2xl shadow-xl">
                  {user.name.charAt(0).toUpperCase()}
               </div>
               <div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{user.name}</h3>
                  <p className="text-xs text-zinc-500 font-medium">{user.email}</p>
               </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-[#2f2f2f] border border-zinc-200 dark:border-white/5 space-y-6">
               <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t('security_key')}</h4>
                    <p className="font-mono text-xs text-zinc-900 dark:text-zinc-300">••••••••••••••••••••••••••••</p>
                  </div>
                  <button 
                    onClick={handleKeyReset}
                    disabled={isResettingKey}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isResettingKey ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    {t('reset_key')}
                  </button>
               </div>
               
               {showKeyResetSuccess && (
                 <div className="flex items-center gap-2 text-green-500 animate-in slide-in-from-left-2 duration-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('key_reset_success')}</span>
                 </div>
               )}
            </div>
          </div>
        )}

        {tab === 'billing' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-8 rounded-3xl bg-zinc-900 text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-48 h-48 bg-zinc-500/10 blur-[80px] rounded-full" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-zinc-400" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('tier')}</p>
                  </div>
                  <h3 className="text-3xl font-black uppercase mb-1 tracking-tighter">{user.tier}</h3>
                  <div className="flex items-center gap-1.5 mb-8">
                    <Activity className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Status</span>
                  </div>
                  <button className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group">
                    {t('manage_subscription')}
                    <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t('balance')}</p>
                  </div>
                  <div className="flex items-end justify-between mb-4">
                    <h3 className="text-4xl font-black tabular-nums">{user.quota.total - user.quota.used}</h3>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Total Limit</p>
                      <p className="text-xs font-bold">{user.quota.total} Credits</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full transition-all duration-1000 ${quotaPercent > 80 ? 'bg-orange-500' : 'bg-zinc-900 dark:bg-white'}`} 
                      style={{ width: `${100 - quotaPercent}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Next reset: {user.quota.resetDate}</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 space-y-4">
               <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">Industrial Compute History</p>
                    <p className="text-[9px] text-zinc-500 font-medium">Real-time log of per-second GPU intensity metrics.</p>
                  </div>
               </div>
               <div className="h-24 bg-zinc-50 dark:bg-black/20 rounded-xl border border-zinc-100 dark:border-white/5 flex items-end gap-1 p-2 overflow-hidden opacity-50">
                  {Array.from({length: 40}).map((_, i) => (
                    <div key={i} className="bg-zinc-300 dark:bg-zinc-700 flex-1 rounded-t-sm" style={{ height: `${Math.random() * 80 + 20}%` }} />
                  ))}
               </div>
            </div>
          </div>
        )}

        {tab === 'data' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div className="flex items-start justify-between gap-6 p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5">
               <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-white/5">
                    <HardDrive className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest mb-1 text-zinc-900 dark:text-white">{t('cache_label')}</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed max-w-sm">{t('cache_desc')}</p>
                  </div>
               </div>
               <button onClick={clearOPFS} className="px-5 py-2.5 rounded-xl bg-zinc-200 dark:bg-white/5 text-zinc-900 dark:text-zinc-300 hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest border border-zinc-300 dark:border-white/10">
                  {t('clear_cache')}
               </button>
            </div>

            <div className="flex items-start justify-between gap-6 p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5">
               <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0 shadow-lg">
                    <Download className="w-5 h-5 text-white dark:text-black" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest mb-1 text-zinc-900 dark:text-white">{t('export_label')}</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed max-w-sm">{t('export_desc')}</p>
                  </div>
               </div>
               <button onClick={exportRealityGraph} className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                  {t('download_json')}
               </button>
            </div>

            <div className="p-6 rounded-3xl border border-red-500/10 bg-red-500/[0.02] flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">{t('danger_zone')}</h4>
                    <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-widest">{t('delete_account')}</p>
                  </div>
               </div>
               <button className="px-5 py-2.5 rounded-xl text-zinc-400 hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-white/5">
                  Terminate Access
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const SettingsTab: React.FC<{ active: boolean, icon: React.ReactNode, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${active ? 'bg-zinc-100 dark:bg-[#2f2f2f] text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-white/10' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
  >
    <div className={`transition-transform group-hover:scale-110 ${active ? 'text-amber-500' : 'text-zinc-400'}`}>
      {icon}
    </div>
    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
    {active && <ChevronRight className="w-3 h-3 ml-auto opacity-40" />}
  </button>
);

const SettingRow: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b border-zinc-100 dark:border-white/5 last:border-0">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</label>
    {children}
  </div>
);

export default DashboardPage;