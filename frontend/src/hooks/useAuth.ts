'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import { User } from '@/types';

export function useAuth(requireAuth = true) {
  const { user, token, setUser, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !token) {
      router.push('/login');
      return;
    }

    if (token && !user) {
      api.get<User>('/api/auth/me')
        .then(setUser)
        .catch(() => {
          logout();
          router.push('/login');
        });
    }
  }, [token, user, requireAuth, router, setUser, logout]);

  return { user, token, logout, isAuthenticated: !!user };
}
