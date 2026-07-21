'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    body?: unknown
  ) => {
    setLoading(true);
    setError(null);

    try {
      let result: T;
      switch (method) {
        case 'get':
          result = await api.get<T>(endpoint);
          break;
        case 'post':
          result = await api.post<T>(endpoint, body);
          break;
        case 'put':
          result = await api.put<T>(endpoint, body);
          break;
        case 'delete':
          result = await api.delete<T>(endpoint);
          break;
      }
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute };
}
