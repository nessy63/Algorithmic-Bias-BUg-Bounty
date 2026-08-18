'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';
import { Shield, LogOut, User } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-navy-900 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold text-gray-900">Bias Bounty</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  <User size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-700">{user.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut size={16} />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
