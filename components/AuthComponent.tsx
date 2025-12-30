
import React, { useState, useEffect, PropsWithChildren } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import Auth from '../views/Auth';
import { Brain, LogOut } from 'lucide-react';

export default function AuthComponent({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
         <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center animate-pulse">
                <Brain className="text-indigo-500 w-6 h-6" />
            </div>
            <p className="text-slate-500 font-bold text-sm animate-pulse">Initializing Habit Tracker...</p>
         </div>
      </div>
    );
  }

  // If not authenticated, render the Auth view
  // The Auth view handles the actual login process (via popup)
  if (!user) {
    return <Auth onLogin={() => {}} />;
  }

  // If authenticated, render the main App content
  return <>{children}</>;
}
