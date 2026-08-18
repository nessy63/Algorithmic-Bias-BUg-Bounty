'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import { User } from '@/types';

export function useAuth(requireAuth = true) {
  const { user, token, setUser, logout } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (requireAuth && !token) {
      setLoading(false);
      router.push('/login');
      return;
    }

    if (token && !user) {
      api
        .get<User>('/api/auth/me')
        .then((fetched) => {
          setUser(fetched);
          setLoading(false);
        })
        .catch(() => {
          logout();
          setLoading(false);
          if (requireAuth) {
            router.push('/login');
          }
        });
    } else {
      setLoading(false);
    }
  }, [token, user, requireAuth, router, setUser, logout]);

  return { user, token, loading, logout, isAuthenticated: !!user };
}
