'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { AdminPanel } from './admin-panel';

export function AdminButton() {
  const [user, setUser] = useState(auth.currentUser);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (user) {
    return (
      <>
        <button
          onClick={() => setIsAdminPanelOpen(true)}
          className="bg-[#1A1A1A] text-[10px] font-mono px-3 py-1.5 rounded border border-[#333] text-[#00FF41] hover:bg-[#222] transition-colors flex items-center gap-2 uppercase tracking-widest"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse" />
          ADMIN
        </button>
        {isAdminPanelOpen && (
          <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsLoginOpen(true)}
        className="text-[10px] font-mono px-3 py-1.5 rounded border border-transparent text-[#555] hover:text-[#AAA] transition-colors uppercase tracking-widest"
      >
        LOGIN
      </button>

      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] p-6 rounded-2xl w-full max-w-sm border border-[#222] shadow-2xl">
            <h2 className="font-heading text-xl text-white mb-4">Admin Access</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
                const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
                signInWithEmailAndPassword(auth, email, password).then(() => {
                  setIsLoginOpen(false);
                }).catch(err => {
                  setError(err.message || 'Login failed');
                });
              }}
              className="flex flex-col gap-4"
            >
              {error && (
                <div className="text-xs text-[#FF3366] bg-[#FF3366]/10 p-3 rounded-lg border border-[#FF3366]/20">
                  {error}
                </div>
              )}
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="bg-[#151515] border border-[#222] rounded-lg px-4 py-2 text-[#E0E0E0] text-sm outline-none focus:border-[#00F0FF] transition-colors"
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                className="bg-[#151515] border border-[#222] rounded-lg px-4 py-2 text-[#E0E0E0] text-sm outline-none focus:border-[#00F0FF] transition-colors"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginOpen(false);
                    setError(null);
                  }}
                  className="px-4 py-2 text-sm text-[#888] hover:text-[#00F0FF] transition-colors font-mono uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-[#E0E0E0] text-black font-medium rounded-lg hover:bg-white transition-colors"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
