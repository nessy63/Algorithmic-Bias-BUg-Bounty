'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import Card, { CardContent } from '@/components/ui/Card';
import { Bot, Bug, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardStats {
  models?: number;
  bounties?: number;
  bugs?: number;
  totalPayouts?: number;
  totalEarnings?: number;
  reputation?: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({});

  useEffect(() => {
    if (user?.role === 'COMPANY') {
      api.get<DashboardStats>('/api/users/stats').then(setStats);
    } else if (user?.role === 'RESEARCHER') {
      api.get<DashboardStats>('/api/users/earnings').then(setStats);
    }
  }, [user]);

  const isCompany = user?.role === 'COMPANY';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Welcome back, {user?.name}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isCompany ? (
          <>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">AI Models</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.models || 0}</p>
                  </div>
                  <div className="p-3 bg-primary-500/15 rounded-lg">
                    <Bot className="h-6 w-6 text-primary-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Bounties</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.bounties || 0}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/15 rounded-lg">
                    <DollarSign className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Bug Reports</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.bugs || 0}</p>
                  </div>
                  <div className="p-3 bg-orange-500/15 rounded-lg">
                    <Bug className="h-6 w-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Payouts</p>
                    <p className="text-3xl font-bold text-gray-900">${(stats.totalPayouts || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-purple-500/15 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Earnings</p>
                    <p className="text-3xl font-bold text-gray-900">${(stats.totalEarnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/15 rounded-lg">
                    <DollarSign className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Reputation</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.reputation || 0}</p>
                  </div>
                  <div className="p-3 bg-primary-500/15 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {isCompany ? (
                <>
                  <a href="/dashboard/company/models" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium">Add AI Model</span>
                    <p className="text-sm text-gray-500">List a new AI model for bounty hunting</p>
                  </a>
                  <a href="/dashboard/company/bounties" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium">Create Bounty</span>
                    <p className="text-sm text-gray-500">Set up a bounty for specific bias types</p>
                  </a>
                  <a href="/dashboard/company/reports" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium">Review Reports</span>
                    <p className="text-sm text-gray-500">Review and respond to bug reports</p>
                  </a>
                </>
              ) : (
                <>
                  <a href="/models" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium">Browse Models</span>
                    <p className="text-sm text-gray-500">Find AI models with active bounties</p>
                  </a>
                  <a href="/dashboard/researcher/reports" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium">My Reports</span>
                    <p className="text-sm text-gray-500">View your submitted bug reports</p>
                  </a>
                  <a href="/dashboard/researcher/earnings" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium">View Earnings</span>
                    <p className="text-sm text-gray-500">Check your bounty earnings</p>
                  </a>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold mb-4">Platform Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Models</span>
                <span className="font-semibold">50+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Open Bounties</span>
                <span className="font-semibold">$100K+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Bugs Fixed</span>
                <span className="font-semibold">500+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg. Resolution Time</span>
                <span className="font-semibold">3 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
