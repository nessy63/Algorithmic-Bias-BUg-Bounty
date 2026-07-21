'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AIModel } from '@/types';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Bot, Plus, Edit2, Trash2 } from 'lucide-react';

export default function CompanyModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '',
    category: '',
    apiEndpoint: '',
    documentation: '',
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const { data } = await api.get<{ data: AIModel[] }>('/api/models?limit=100');
      setModels(data);
    } catch (error) {
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/models', formData);
      toast.success('Model created successfully');
      setShowModal(false);
      setFormData({ name: '', description: '', version: '', category: '', apiEndpoint: '', documentation: '' });
      loadModels();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create model');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;
    try {
      await api.delete(`/api/models/${id}`);
      toast.success('Model deleted');
      loadModels();
    } catch (error) {
      toast.error('Failed to delete model');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Models</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={18} className="mr-2" /> Add Model
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : models.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No models yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first AI model</p>
            <Button onClick={() => setShowModal(true)}>Add Model</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {models.map((model) => (
            <Card key={model.id} variant="bordered">
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <Bot className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{model.name}</h3>
                      <p className="text-sm text-gray-500">{model.category} • v{model.version}</p>
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      model.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      model.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {model.status}
                    </span>
                    <button
                      onClick={() => handleDelete(model.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add AI Model">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Model Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., GPT-4 Fine-tuned"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your AI model"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Version"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="1.0.0"
              required
            />
            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="NLP, Vision, etc."
              required
            />
          </div>
          <Input
            label="API Endpoint (optional)"
            value={formData.apiEndpoint}
            onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
            placeholder="https://api.example.com/v1/predict"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Model</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
