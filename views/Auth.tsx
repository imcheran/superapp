
import React, { useState } from 'react';
import { User } from '../types';
import { ArrowRight, Brain, Sparkles, ShieldCheck, Globe, AlertTriangle } from 'lucide-react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin({
        username: username.trim(),
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        if (user) {
            onLogin({
                username: user.displayName || user.email?.split('@')[0] || 'Traveler',
                createdAt: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error("Google Auth Error:", error);
        
        if (error.code === 'auth/unauthorized-domain') {
            const currentDomain = window.location.hostname;
            setErrorMsg(`Domain Authorization Required. Please add "${currentDomain}" to your Firebase Console > Authentication > Settings > Authorized Domains.`);
        } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/configuration-not-found') {
             setErrorMsg("Firebase Setup Required: Please check your API keys in services/firebase.ts");
        } else if (error.code === 'auth/popup-closed-by-user') {
             // User closed popup, no error needed
        } else {
             setErrorMsg(`Sign in failed: ${error.message}`);
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8 pt-10 text-center ring-1 ring-white/5">
          
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-default">
                <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300">
                    <Brain className="text-indigo-400 w-8 h-8" />
                </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-black text-white mb-8 tracking-tight">Habit Tracker</h1>

          {errorMsg && (
             <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-left flex gap-3">
                 <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                 <div className="space-y-1">
                     <p className="text-rose-200 text-xs font-bold uppercase">Authentication Error</p>
                     <p className="text-rose-100 text-xs leading-relaxed">{errorMsg}</p>
                 </div>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
                <label htmlFor="username" className="text-xs font-bold text-slate-500 uppercase ml-1">Enter your name here</label>
                <div className="relative group">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="relative w-full px-5 py-3.5 bg-slate-800/60 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-indigo-500/50 focus:bg-slate-800 focus:outline-none transition-all font-bold text-base"
                        placeholder="Enter your name"
                        autoFocus
                    />
                </div>
            </div>
            
            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20 active:scale-[0.98] mt-2"
            >
              Enter System
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform text-indigo-200" />
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OR</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-slate-900 hover:bg-slate-50 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" fill="#EA4335"/>
                  <path d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4"/>
                  <path d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" fill="#FBBC05"/>
                  <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z" fill="#34A853"/>
                </svg>
            )}
            {loading ? 'Connecting...' : 'Continue with Google'}
          </button>
          
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
             <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <ShieldCheck size={12} className="text-emerald-500" /> 
                <span>Secure Authentication</span>
             </div>
          </div>
        </div>
        
        <p className="text-center text-slate-600 text-[10px] mt-6 font-medium opacity-50 uppercase tracking-widest">
           v1.2.6 • Habit Tracker
        </p>
      </div>
    </div>
  );
};

export default Auth;
