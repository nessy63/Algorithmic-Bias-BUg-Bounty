import { Bounty } from '@/types';
import Card, { CardContent } from '@/components/ui/Card';
import { DollarSign, AlertTriangle, Clock } from 'lucide-react';

interface BountyTrackerProps {
  bounty: Bounty;
}

export default function BountyTracker({ bounty }: BountyTrackerProps) {
  const severityColors = {
    LOW: 'text-gray-600',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-orange-400',
    CRITICAL: 'text-red-400',
  };

  const statusColors = {
    OPEN: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-blue-100 text-blue-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    EXPIRED: 'bg-red-100 text-red-800',
  };

  return (
    <Card variant="bordered">
      <CardContent>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{bounty.title}</h3>
            <p className="text-sm text-gray-500">{bounty.model.name}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[bounty.status]}`}>
            {bounty.status}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {bounty.description}
        </p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <DollarSign size={16} className="text-emerald-400" />
            <span className="font-medium text-emerald-400">${bounty.amount.toLocaleString()}</span>
          </div>

          <div className={`flex items-center gap-1 ${severityColors[bounty.severity]}`}>
            <AlertTriangle size={16} />
            <span className="font-medium">{bounty.severity}</span>
          </div>

          {bounty._count && (
            <span className="text-gray-500">
              {bounty._count.bugReports} reports
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
