'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'COMPANY' | 'RESEARCHER'>(
    (searchParams.get('role') as 'COMPANY' | 'RESEARCHER') || 'RESEARCHER'
  );
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyDescription: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { user, token } = await api.post<{ user: any; token: string }>('/api/auth/register', {
        ...formData,
        role,
      });
      setToken(token);
      setUser(user);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join the fight against algorithmic bias</p>
        </div>

        <div className="bg-navy-800 rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Role Selection */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole('RESEARCHER')}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                role === 'RESEARCHER'
                  ? 'bg-primary-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Researcher
            </button>
            <button
              type="button"
              onClick={() => setRole('COMPANY')}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                role === 'COMPANY'
                  ? 'bg-primary-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Company
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              required
            />

            {role === 'COMPANY' && (
              <>
                <Input
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Acme Corp"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    value={formData.companyDescription}
                    onChange={(e) => setFormData({ ...formData, companyDescription: e.target.value })}
                    placeholder="Brief description of your company"
                  />
                </div>
              </>
            )}

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength={8}
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
            />

            <Button type="submit" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
