
import React from 'react';
import { MessageSquare, User } from 'lucide-react';
import { NavigationTab } from '../types';

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-t border-zinc-800 px-6 py-2 md:hidden">
      <div className="flex items-center justify-center gap-16 max-w-md mx-auto">
        <NavItem 
          icon={<MessageSquare />} 
          label="Productions" 
          active={activeTab === NavigationTab.CHAT} 
          onClick={() => onTabChange(NavigationTab.CHAT)} 
        />
        <NavItem 
          icon={<User />} 
          label="Profile" 
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
    className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-purple-500' : 'text-zinc-500'}`}
  >
    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
    <span className="text-[10px] font-medium uppercase tracking-widest">{label}</span>
  </button>
);

export default BottomNav;
