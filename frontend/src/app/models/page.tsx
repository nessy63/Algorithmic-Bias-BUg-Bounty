'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AIModel } from '@/types';
import ModelCard from '@/components/features/ModelCard';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';

export default function ModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    loadModels();
  }, [category]);

  const loadModels = async () => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (category) params.append('category', category);
      const { data } = await api.get<{ data: AIModel[] }>(`/api/models?${params}`);
      setModels(data);
    } catch (error) {
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(search.toLowerCase()) ||
      model.description.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(models.map((m) => m.category)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Models</h1>
        <p className="text-gray-600">Browse AI models with active bounties</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No models found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}
