import React from 'react';
import { Globe, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  quotaUsed: number;
  quotaTotal: number;
}

const Header: React.FC<HeaderProps> = ({ quotaUsed, quotaTotal }) => {
  const { t, i18n } = useTranslation();
  const percentage = (quotaUsed / quotaTotal) * 100;

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#212121] px-4 py-3 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center overflow-hidden">
          <Video className="w-4 h-4 text-white dark:text-black" />
        </div>
        <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white uppercase">
          LATEX <span className="text-zinc-400 dark:text-zinc-500 font-medium">VISION</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#2f2f2f] transition-all group cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-white/10"
        >
          <Globe className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">
            {(i18n.language || 'RU').toUpperCase()}
          </span>
        </button>

        <div className="hidden sm:flex items-center gap-3">
          <div className="w-24 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ${percentage > 80 ? 'bg-orange-500' : 'bg-zinc-900 dark:bg-white'}`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-tighter">{t('credits')}: {quotaUsed}/{quotaTotal}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;