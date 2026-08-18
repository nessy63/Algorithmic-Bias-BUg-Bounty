'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import { User } from '@/types';

export function useAuth(requireAuth = true) {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    api
      .get<User>('/api/auth/me')
      .then((fetched) => {
        if (!cancelled) {
          setUser(fetched);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          if (requireAuth) {
            router.push('/login');
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, requireAuth, router, setUser]);

  return { user, loading, logout, isAuthenticated: !!user };
}
