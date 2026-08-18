'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Bounty, AIModel } from '@/types';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { DollarSign, Plus, AlertTriangle } from 'lucide-react';

export default function CompanyBountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    maxPayout: '',
    severity: 'MEDIUM',
    modelId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bountiesRes, modelsRes] = await Promise.all([
        api.get<{ data: Bounty[] }>('/api/bounties?limit=100'),
        api.get<{ data: AIModel[] }>('/api/models?limit=100'),
      ]);
      setBounties(bountiesRes.data);
      setModels(modelsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/bounties', {
        ...formData,
        amount: parseFloat(formData.amount),
        maxPayout: parseFloat(formData.maxPayout),
      });
      toast.success('Bounty created successfully');
      setShowModal(false);
      setFormData({ title: '', description: '', amount: '', maxPayout: '', severity: 'MEDIUM', modelId: '' });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create bounty');
    }
  };

  const severityColors = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bounties</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={18} className="mr-2" /> Create Bounty
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : bounties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bounties yet</h3>
            <p className="text-gray-500 mb-4">Create a bounty to incentivize bias reports</p>
            <Button onClick={() => setShowModal(true)}>Create Bounty</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bounties.map((bounty) => (
            <Card key={bounty.id} variant="bordered">
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{bounty.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{bounty.model.name}</p>
                    <p className="text-sm text-gray-600">{bounty.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">${bounty.amount.toLocaleString()}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[bounty.severity]}`}>
                        {bounty.severity}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bounty.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                      bounty.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {bounty.status}
                    </span>
                  </div>
                </div>
                {bounty._count && (
                  <p className="text-sm text-gray-500 mt-2">
                    {bounty._count.bugReports} reports submitted
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Bounty">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Gender Bias in Hiring"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what bias you're looking for"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.modelId}
              onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
              required
            >
              <option value="">Select a model</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Bounty Amount ($)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="5000"
              min="10"
              required
            />
            <Input
              label="Max Payout ($)"
              type="number"
              value={formData.maxPayout}
              onChange={(e) => setFormData({ ...formData, maxPayout: e.target.value })}
              placeholder="5000"
              min="10"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <div className="flex gap-2">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: level })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.severity === level
                      ? `${severityColors[level as keyof typeof severityColors]} ring-2 ring-primary-500`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Bounty</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
