
import React, { useState } from 'react';
import { User } from '../types';
import { ArrowRight, Brain, ShieldCheck, Mail } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Map Firebase user to App User type
      onLogin({
        username: user.displayName || user.email?.split('@')[0] || 'Explorer',
        createdAt: new Date().toISOString(),
        // You might want to extend the User type in types.ts to store email/uid if needed later
      });
    } catch (error) {
      console.error("Login failed", error);
      alert("Google login failed. Please check your connection or try the Guest option.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin({
        username: username.trim(),
        createdAt: new Date().toISOString()
      });
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
          
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">OmniLife</h1>
          <p className="text-slate-400 text-sm mb-8">Your external brain for habits & focus.</p>

          <div className="space-y-4">
            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 text-slate-900 py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-[#161e31] px-2 text-slate-500 font-bold uppercase">Or continue as guest</span>
                </div>
            </div>

            {/* Manual Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="relative w-full px-5 py-3.5 bg-slate-800/60 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-indigo-500/50 focus:bg-slate-800 focus:outline-none transition-all font-bold text-base"
                      placeholder="Enter a display name..."
                  />
              </div>
              
              <button
                type="submit"
                disabled={!username.trim()}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed border border-white/5 active:scale-[0.98]"
              >
                Enter System Locally
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-slate-400" />
              </button>
            </form>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
             <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <ShieldCheck size={12} className="text-emerald-500" /> 
                <span>Secure Cloud Sync & Local Storage</span>
             </div>
          </div>
        </div>
        
        <p className="text-center text-slate-600 text-[10px] mt-6 font-medium opacity-50 uppercase tracking-widest">
           v1.2.8 • OmniLife
        </p>
      </div>
    </div>
  );
};

export default Auth;
