'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BugReport } from '@/types';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { Bug, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function CompanyReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [companyNotes, setCompanyNotes] = useState('');

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

  const updateStatus = async (id: string, status: string, notes?: string) => {
    try {
      await api.put(`/api/bugs/${id}`, { status, companyNotes: notes });
      toast.success('Report updated');
      setSelectedReport(null);
      setCompanyNotes('');
      loadReports();
    } catch (error) {
      toast.error('Failed to update report');
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
    MEDIUM: 'text-yellow-600',
    HIGH: 'text-orange-600',
    CRITICAL: 'text-red-600',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bug Reports</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
            <p className="text-gray-500">Bug reports will appear here when researchers submit them</p>
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
                      {report.model.name} • Bounty: {report.bounty.title}
                    </p>
                    <p className="text-sm text-gray-600">{report.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className={severityColors[report.severity]}>
                        Severity: {report.severity}
                      </span>
                      <span className="text-gray-500">
                        By: {report.researcher?.user?.name || 'Unknown'}
                      </span>
                      <span className="text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedReport}
        onClose={() => {
          setSelectedReport(null);
          setCompanyNotes('');
        }}
        title="Review Bug Report"
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{selectedReport.title}</h3>
              <p className="text-gray-600">{selectedReport.description}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-1">Reproduction Steps</h4>
              <pre className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                {selectedReport.reproductionSteps}
              </pre>
            </div>

            {selectedReport.inputExample && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Input Example</h4>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                  {selectedReport.inputExample}
                </pre>
              </div>
            )}

            {selectedReport.outputExample && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Output Example</h4>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                  {selectedReport.outputExample}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Expected Behavior</h4>
                <p className="text-sm text-gray-600">{selectedReport.expectedBehavior}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Actual Behavior</h4>
                <p className="text-sm text-gray-600">{selectedReport.actualBehavior}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                value={companyNotes}
                onChange={(e) => setCompanyNotes(e.target.value)}
                placeholder="Add notes about this report..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="danger"
                onClick={() => updateStatus(selectedReport.id, 'REJECTED', companyNotes)}
              >
                <XCircle size={16} className="mr-2" /> Reject
              </Button>
              <Button
                variant="secondary"
                onClick={() => updateStatus(selectedReport.id, 'UNDER_REVIEW', companyNotes)}
              >
                <Clock size={16} className="mr-2" /> Under Review
              </Button>
              <Button
                onClick={() => updateStatus(selectedReport.id, 'ACCEPTED', companyNotes)}
              >
                <CheckCircle size={16} className="mr-2" /> Accept
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
