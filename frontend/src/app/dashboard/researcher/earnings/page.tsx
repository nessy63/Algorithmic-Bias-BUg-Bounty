'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Card, { CardContent } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { DollarSign, TrendingUp, Award } from 'lucide-react';

interface EarningsData {
  totalEarnings: number;
  reputation: number;
  paidBugs: Array<{
    id: string;
    title: string;
    status: string;
    bounty: { amount: number };
    createdAt: string;
  }>;
}

export default function ResearcherEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const result = await api.get<EarningsData>('/api/users/earnings');
      setData(result);
    } catch (error) {
      toast.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Earnings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${(data?.totalEarnings || 0).toLocaleString()}
                </p>
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
                <p className="text-sm text-gray-500">Reputation Score</p>
                <p className="text-3xl font-bold text-gray-900">{data?.reputation || 0}</p>
              </div>
              <div className="p-3 bg-primary-500/15 rounded-lg">
                <Award className="h-6 w-6 text-primary-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Bugs Paid</p>
                <p className="text-3xl font-bold text-gray-900">{data?.paidBugs.length || 0}</p>
              </div>
              <div className="p-3 bg-purple-500/15 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Payment History</h2>
          {data?.paidBugs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No payments yet</p>
          ) : (
            <div className="space-y-4">
              {data?.paidBugs.map((bug) => (
                <div
                  key={bug.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{bug.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(bug.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-emerald-400">
                    +${bug.bounty.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
