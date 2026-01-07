
import React, { useState } from 'react';
import { Loader2, ChevronRight, CheckCircle2, Video, Sparkles, Mail, Lock } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Имитация задержки входа, пускает даже с пустыми полями
    setTimeout(() => {
      onLogin(email || 'executive@svipro.ai');
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row overflow-hidden">
      {/* Left side: Value Prop */}
      <div className="hidden md:flex flex-1 relative bg-zinc-950 p-12 flex-col justify-between overflow-hidden border-r border-zinc-900">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-xl shadow-purple-500/20">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">SVI 2.0 Pro</span>
          </div>

          <h1 className="text-6xl font-extrabold text-white leading-[1.1] mb-6">
            Cinematic AI <br />
            <span className="text-zinc-500">Video Reimagined.</span>
          </h1>
          <p className="text-zinc-400 text-xl max-w-lg mb-12 leading-relaxed">
            The world's first conversational platform for long-form AI video. From a single thought to a multi-minute masterpiece.
          </p>

          <div className="space-y-6">
            <Feature icon={<CheckCircle2 className="text-purple-500 w-5 h-5" />} text="Extended narrative generation up to 5 minutes" />
            <Feature icon={<CheckCircle2 className="text-purple-500 w-5 h-5" />} text="Conversational AI prompt engineering" />
            <Feature icon={<CheckCircle2 className="text-purple-500 w-5 h-5" />} text="Interactive button-based scene building" />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
          <span>&copy; 2026 SVI 2.0 Pro</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-zinc-950/50">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
               <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Production Access</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-4">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-purple-500 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="executive@svipro.ai"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-4">Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-purple-500 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-black py-5 rounded-[2rem] hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group relative overflow-hidden shadow-xl mt-8"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Initialize Session
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.5em]">Developer Preview • Wan 2.2 SVI</p>
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
              <div className="w-1.5 h-1.5 rounded-full bg-purple-900" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Feature: React.FC<{ icon: React.ReactNode, text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl">
    <div className="flex-shrink-0">{icon}</div>
    <span className="text-zinc-400 font-bold text-sm tracking-tight">{text}</span>
  </div>
);

export default LoginPage;
