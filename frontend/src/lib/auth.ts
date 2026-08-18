import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { api } from './api';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isCompany: () => boolean;
  isResearcher: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,

  setUser: (user) => set({ user }),

  logout: () => {
    // Clear the httpOnly session cookie server-side, then drop local state.
    api.post('/api/auth/logout', {}).catch(() => {});
    set({ user: null });
  },

  isCompany: () => get().user?.role === 'COMPANY',
  isResearcher: () => get().user?.role === 'RESEARCHER',
}));
