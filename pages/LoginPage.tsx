
import React, { useState } from 'react';
import { 
  Loader2, 
  ChevronRight, 
  Sparkles, 
  Mail, 
  Lock, 
  Cpu, 
  Fingerprint, 
  Infinity, 
  ShieldCheck,
  Globe,
  Video
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../components/ThemeToggle';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const steps = [
      "auth_step_1",
      "auth_step_2",
      "auth_step_3",
      "auth_step_4"
    ];

    let stepIdx = 0;
    setLoadingStep(t(steps[0]));

    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setLoadingStep(t(steps[stepIdx]));
      } else {
        clearInterval(stepInterval);
        onLogin(email || 'director@latex.ai');
        setIsLoading(false);
      }
    }, 600);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col lg:flex-row overflow-hidden font-sans text-zinc-900 dark:text-zinc-100 selection:bg-purple-500/30 selection:text-purple-900 dark:selection:text-white relative transition-colors duration-500">
      
      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <ThemeToggle />
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-black/40 backdrop-blur-md border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all group cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white shadow-sm"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest min-w-[1.5rem] text-center">
            {(i18n.language || 'EN').toUpperCase()}
          </span>
        </button>
      </div>

      {/* LEFT PANEL: System Overview & Marketing */}
      <div className="hidden lg:flex flex-1 relative bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/50 p-16 flex-col justify-between overflow-hidden transition-colors duration-500">
        
        {/* Dynamic Background Elements - Adaptive */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-zinc-200/50 dark:bg-zinc-800/20 blur-[150px] rounded-full animate-pulse duration-1000" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] bg-zinc-300/30 dark:bg-zinc-900/40 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 pointer-events-none"></div>

        <div className="relative z-10 space-y-12">
          {/* Brand Header */}
          <div className="flex items-center gap-4">
            {/* LOGO HANDLING: Inverted in Dark Mode to become White */}
            <div className="w-12 h-12 bg-zinc-100 dark:bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-transparent">
              {!logoError ? (
                <img 
                  src="logo.png" 
                  alt="Latex Vision Logo" 
                  className="w-full h-full object-cover dark:invert transition-[filter] duration-500" 
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Video className="w-6 h-6 text-black" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-black dark:text-white uppercase leading-none">LATEX <span className="text-zinc-400 dark:text-zinc-500">VISION</span></h1>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-[0.4em] uppercase mt-1">Elastic Reality Suite</p>
            </div>
          </div>

          {/* Main Value Prop */}
          <div className="space-y-6">
            <h2 className="text-5xl font-black text-black dark:text-white leading-[1.05] tracking-tight">
              {t('infinite_cinema')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-zinc-800 dark:from-zinc-400 dark:to-zinc-600">{t('zero_latency')}</span>
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
              {t('login_desc')}
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 gap-6 max-w-lg">
            <FeatureRow 
              icon={<Fingerprint className="text-zinc-900 dark:text-white" />} 
              title={t('identity_matrix')}
              desc={t('identity_desc')}
            />
            <FeatureRow 
              icon={<Cpu className="text-zinc-500 dark:text-zinc-400" />} 
              title={t('director_intelligence')}
              desc={t('director_desc')}
            />
            <FeatureRow 
              icon={<Infinity className="text-zinc-400 dark:text-zinc-500" />} 
              title={t('seamless_loop')}
              desc={t('seamless_desc')}
            />
          </div>
        </div>

        {/* Clean Professional Footer */}
        <div className="relative z-10 mt-auto pt-12 border-t border-zinc-100 dark:border-white/5">
          <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('operational')}</span>
             </div>
             <span className="text-[10px] font-mono tracking-wider">{t('version_info')}</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Login Terminal */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-100/50 dark:bg-zinc-950/80 backdrop-blur-xl relative transition-colors duration-500">
        <div className="w-full max-w-md space-y-10">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-6 shadow-xl dark:shadow-2xl relative group transition-all duration-500">
              <div className="absolute inset-0 rounded-full bg-purple-500/10 dark:bg-white/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <Sparkles className="w-8 h-8 text-black dark:text-white relative z-10" />
            </div>
            <h3 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight">{t('studio_access')}</h3>
            <p className="text-sm text-zinc-500 font-medium">{t('enter_creds')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">{t('producer_id')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@latex.ai"
                    className="w-full bg-white dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none focus:border-zinc-400 dark:focus:border-white/50 focus:ring-1 focus:ring-zinc-200 dark:focus:ring-white/20 transition-all font-medium shadow-sm"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">{t('security_key')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none focus:border-zinc-400 dark:focus:border-white/50 focus:ring-1 focus:ring-zinc-200 dark:focus:ring-white/20 transition-all font-medium shadow-sm"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-black dark:bg-white text-white dark:text-black h-16 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {isLoading ? (
                <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('processing')}</span>
                  </div>
                  <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold tracking-normal normal-case">{loadingStep}</span>
                </div>
              ) : (
                <>
                  {t('launch_env')}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" />
            <span>{t('encrypted_session')}</span>
          </div>
        </div>
        
        {/* Mobile Footer */}
        <div className="lg:hidden absolute bottom-8 text-center w-full px-8">
           <p className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">{t('mobile_view')}</p>
        </div>
      </div>
    </div>
  );
};

// Helper Components for the Marketing Side
const FeatureRow: React.FC<{ icon: React.ReactElement<{ className?: string }>, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-white/5 group">
    <div className="mt-1 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-colors">
      {React.cloneElement(icon, { className: `w-5 h-5 ${icon.props.className || ''}` })}
    </div>
    <div>
      <h3 className="text-black dark:text-white font-bold text-sm mb-1">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-700 dark:group-hover:text-zinc-400 transition-colors">{desc}</p>
    </div>
  </div>
);

export default LoginPage;
