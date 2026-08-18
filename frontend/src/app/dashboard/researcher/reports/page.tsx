'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BugReport } from '@/types';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function ResearcherReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data } = await api.get<{ data: BugReport[] }>('/api/bugs?limit=100');
      setReports(data);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    SUBMITTED: 'bg-blue-100 text-blue-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    REPRODUCIBLE: 'bg-green-100 text-green-800',
    NOT_REPRODUCIBLE: 'bg-red-100 text-red-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PAID: 'bg-purple-100 text-purple-800',
  };

  const severityColors = {
    LOW: 'text-gray-600',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-orange-400',
    CRITICAL: 'text-red-400',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bug Reports</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
            <p className="text-gray-500 mb-4">Start browsing models to find bounties</p>
            <Link href="/models" className="text-primary-400 hover:text-primary-300 font-medium">
              Browse Models →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} variant="bordered">
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{report.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      {report.model.name} • {report.model.company.name}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className={severityColors[report.severity]}>
                        {report.severity}
                      </span>
                      <span className="text-emerald-400 font-medium">
                        Bounty: ${report.bounty.amount.toLocaleString()}
                      </span>
                      <span className="text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link href={`/models/${report.model.id}`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink size={16} />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
