'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import {
  LayoutDashboard,
  Bot,
  Bug,
  Wallet,
  Settings,
  Search,
  FileText,
  Shield,
  ScrollText,
} from 'lucide-react';

const companyLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/company/models', label: 'AI Models', icon: Bot },
  { href: '/dashboard/company/bounties', label: 'Bounties', icon: Wallet },
  { href: '/dashboard/company/reports', label: 'Bug Reports', icon: Bug },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/logs', label: 'Logs', icon: ScrollText },
];

const researcherLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/models', label: 'Browse Models', icon: Search },
  { href: '/dashboard/sandbox', label: 'Sandbox Testing', icon: Shield },
  { href: '/dashboard/researcher/reports', label: 'My Reports', icon: FileText },
  { href: '/dashboard/researcher/earnings', label: 'Earnings', icon: Wallet },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/logs', label: 'Logs', icon: ScrollText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const links = user?.role === 'COMPANY' ? companyLinks : researcherLinks;

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-500/15 text-primary-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
