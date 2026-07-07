'use client';

import { create } from 'zustand';

interface LanguageState {
  lang: 'en' | 'ru';
  toggle: () => void;
  setLang: (lang: 'en' | 'ru') => void;
}

export const useLanguage = create<LanguageState>((set) => ({
  lang: 'en',
  toggle: () => set((state) => ({ lang: state.lang === 'en' ? 'ru' : 'en' })),
  setLang: (lang) => set({ lang }),
}));
