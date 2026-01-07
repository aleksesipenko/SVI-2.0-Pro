import React from 'react';
import { MessageSquare, User, LayoutGrid } from 'lucide-react';
import { NavigationTab } from '../types';
import { useTranslation } from 'react-i18next';

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#171717]/90 backdrop-blur-xl border-t border-zinc-200 dark:border-white/5 px-6 py-2 md:hidden transition-colors">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <NavItem 
          icon={<LayoutGrid />} 
          label={t('productions')} 
          active={activeTab === NavigationTab.CHAT} 
          onClick={() => onTabChange(NavigationTab.CHAT)} 
        />
        <NavItem 
          icon={<User />} 
          label={t('profile')} 
          active={activeTab === NavigationTab.PROFILE} 
          onClick={() => onTabChange(NavigationTab.PROFILE)} 
        />
      </div>
    </nav>
  );
};

const NavItem: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-zinc-900 dark:text-white scale-105' : 'text-zinc-400'}`}
  >
    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
    <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export default BottomNav;