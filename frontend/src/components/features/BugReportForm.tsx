'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

interface BugReportFormProps {
  modelId: string;
  bountyId: string;
  onSuccess?: () => void;
}

const severityOptions = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100' },
];

export default function BugReportForm({ modelId, bountyId, onSuccess }: BugReportFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reproductionSteps: '',
    inputExample: '',
    outputExample: '',
    expectedBehavior: '',
    actualBehavior: '',
    severity: 'MEDIUM',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/bugs', {
        ...formData,
        modelId,
        bountyId,
      });

      toast.success('Bug report submitted successfully!');
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Brief description of the bias bug"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed description of the bias found"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reproduction Steps
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={4}
          value={formData.reproductionSteps}
          onChange={(e) => setFormData({ ...formData, reproductionSteps: e.target.value })}
          placeholder="Step-by-step instructions to reproduce the issue"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Input Example
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            rows={3}
            value={formData.inputExample}
            onChange={(e) => setFormData({ ...formData, inputExample: e.target.value })}
            placeholder="Example input that triggers the bias"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Output Example
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            rows={3}
            value={formData.outputExample}
            onChange={(e) => setFormData({ ...formData, outputExample: e.target.value })}
            placeholder="Example biased output"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Behavior
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
            value={formData.expectedBehavior}
            onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
            placeholder="What should have happened"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Actual Behavior
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
            value={formData.actualBehavior}
            onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
            placeholder="What actually happened"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Severity
        </label>
        <div className="flex gap-2">
          {severityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, severity: option.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.severity === option.value
                  ? `${option.color} ring-2 ring-primary-500`
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Submit Report
        </Button>
      </div>
    </form>
  );
}
