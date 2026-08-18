'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { AIModel, Bounty } from '@/types';
import { useAuthStore } from '@/lib/auth';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import BugReportForm from '@/components/features/BugReportForm';
import toast from 'react-hot-toast';
import { Bot, DollarSign, AlertTriangle, ExternalLink, Shield } from 'lucide-react';

export default function ModelDetailPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [model, setModel] = useState<(AIModel & { bounties: Bounty[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);

  useEffect(() => {
    loadModel();
  }, [params.id]);

  const loadModel = async () => {
    try {
      const data = await api.get<AIModel & { bounties: Bounty[] }>(`/api/models/${params.id}`);
      setModel(data);
    } catch (error) {
      toast.error('Failed to load model');
    } finally {
      setLoading(false);
    }
  };

  const severityColors = {
    LOW: 'text-gray-600',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-orange-400',
    CRITICAL: 'text-red-400',
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Model not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Model Header */}
      <div className="bg-navy-800 rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-primary-500/15 rounded-xl">
            <Bot className="h-10 w-10 text-primary-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{model.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                model.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                model.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {model.status}
              </span>
            </div>
            <p className="text-gray-600 mb-2">{model.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>By {model.company.name}</span>
              <span>v{model.version}</span>
              <span>{model.category}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Bounties */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Active Bounties</h2>
          {model.bounties.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <DollarSign className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No active bounties</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {model.bounties.map((bounty) => (
                <Card key={bounty.id} variant="bordered">
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{bounty.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{bounty.description}</p>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <DollarSign size={16} />
                            {bounty.amount.toLocaleString()}
                          </span>
                          <span className={`flex items-center gap-1 ${severityColors[bounty.severity]}`}>
                            <AlertTriangle size={16} />
                            {bounty.severity}
                          </span>
                        </div>
                      </div>
                      {user?.role === 'RESEARCHER' && (
                        <Button onClick={() => setSelectedBounty(bounty)}>
                          Submit Report
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Model Info</h3>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Company</dt>
                  <dd className="font-medium">{model.company.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Version</dt>
                  <dd className="font-medium">{model.version}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Category</dt>
                  <dd className="font-medium">{model.category}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Total Reports</dt>
                  <dd className="font-medium">{model._count?.bugReports || 0}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {model.apiEndpoint && (
            <Card className="mt-4">
              <CardContent>
                <h3 className="font-semibold mb-2">Sandbox Testing</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Test this model in our sandboxed environment
                </p>
                <Button variant="secondary" className="w-full">
                  <Shield size={16} className="mr-2" />
                  Open Sandbox
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bug Report Modal */}
      <Modal
        isOpen={!!selectedBounty}
        onClose={() => setSelectedBounty(null)}
        title="Submit Bug Report"
        size="lg"
      >
        {selectedBounty && (
          <BugReportForm
            modelId={model.id}
            bountyId={selectedBounty.id}
            onSuccess={() => setSelectedBounty(null)}
          />
        )}
      </Modal>
    </div>
  );
}
