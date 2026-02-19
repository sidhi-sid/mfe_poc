import { create } from 'zustand'
import { applyLanguage, getStoredLanguage, type Language } from '@/lib/language'

interface User {
  name: string
  email: string
}

interface AuthState {
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: { name: 'Avinash', email: 'avinash@bankmuscat.com' }, // Default mock user
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}))

interface ThemeState {
  color: string
  setColor: (color: string) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  color: 'black', // Default theme
  setColor: (color) => set({ color }),
}))

interface LanguageState {
  language: Language
  isRTL: boolean
  setLanguage: (lang: Language) => void
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getStoredLanguage(),
  isRTL: getStoredLanguage() === 'ar',
  setLanguage: (lang) => {
    applyLanguage(lang)
    set({ language: lang, isRTL: lang === 'ar' })
  },
}))
