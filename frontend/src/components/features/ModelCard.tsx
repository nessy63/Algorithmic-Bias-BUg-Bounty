import Link from 'next/link';
import { AIModel } from '@/types';
import Card, { CardContent } from '@/components/ui/Card';
import { Bot, ExternalLink } from 'lucide-react';

interface ModelCardProps {
  model: AIModel;
}

export default function ModelCard({ model }: ModelCardProps) {
  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    UNDER_REVIEW: 'bg-red-100 text-red-800',
  };

  return (
    <Link href={`/models/${model.id}`}>
      <Card variant="bordered" className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="h-full flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500/15 rounded-lg">
                <Bot className="h-6 w-6 text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{model.name}</h3>
                <p className="text-sm text-gray-500">{model.company.name}</p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[model.status]}`}>
              {model.status}
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-2">
            {model.description}
          </p>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">v{model.version}</span>
            <span className="text-primary-400 flex items-center gap-1">
              View Details <ExternalLink size={14} />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
