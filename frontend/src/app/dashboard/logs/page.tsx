'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { ScrollText, RefreshCw, AlertTriangle } from 'lucide-react';

interface LogEntry {
  timestamp?: string;
  level?: string;
  message?: string;
  [key: string]: unknown;
}

interface LogsResponse {
  errors: LogEntry[];
  combined: LogEntry[];
  count: number;
}

const levelColors: Record<string, string> = {
  error: 'bg-red-500/15 text-red-300',
  warn: 'bg-yellow-500/15 text-yellow-300',
  info: 'bg-primary-500/15 text-primary-300',
};

function Entry({ entry, showLevel }: { entry: LogEntry; showLevel: boolean }) {
  const meta = { ...entry };
  delete meta.timestamp;
  delete meta.level;
  delete meta.message;
  delete meta.service;

  const hasMeta = Object.keys(meta).length > 0;

  return (
    <div className="py-2 border-b border-gray-200 last:border-0 font-mono text-xs">
      <div className="flex items-start gap-2">
        {showLevel && entry.level && (
          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${levelColors[entry.level] || 'bg-gray-100 text-gray-500'}`}>
            {entry.level}
          </span>
        )}
        {entry.timestamp && (
          <span className="shrink-0 text-gray-500">{entry.timestamp}</span>
        )}
        <span className="text-gray-700 break-all">{entry.message}</span>
      </div>
      {hasMeta && (
        <pre className="mt-1 ml-1 text-gray-500 whitespace-pre-wrap break-all">
          {JSON.stringify(meta, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<LogsResponse>('/api/logs?limit=100');
      setLogs(data);
      setDisabled(false);
    } catch (error) {
      setDisabled(true);
      setLogs(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ScrollText className="h-8 w-8 text-primary-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Log Viewer</h1>
            <p className="text-gray-500 text-sm">Recent backend logs (newest first)</p>
          </div>
        </div>
        <Button onClick={loadLogs} loading={loading} variant="secondary">
          <RefreshCw size={16} className="mr-2" /> Refresh
        </Button>
      </div>

      {disabled && !loading && (
        <Card className="mb-6">
          <CardContent className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Log viewer unavailable</p>
              <p className="text-sm text-gray-600">
                The log viewer is disabled by default because logs can contain sensitive
                data. Set{' '}
                <code className="bg-gray-100 px-1 rounded">ENABLE_LOG_VIEWER=true</code> to
                enable it. Served entries are redacted.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <h2 className="font-semibold flex items-center gap-2">
              <span className="h-2 w-2 bg-red-400 rounded-full" /> Error Log
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-center text-gray-500 py-8 text-sm">Loading...</p>
            ) : logs?.errors.length ? (
              <div className="px-4 py-2">
                {logs.errors.map((entry, i) => (
                  <Entry key={i} entry={entry} showLevel={false} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8 text-sm">No errors logged</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold flex items-center gap-2">
              <span className="h-2 w-2 bg-primary-400 rounded-full" /> Combined Log
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-center text-gray-500 py-8 text-sm">Loading...</p>
            ) : logs?.combined.length ? (
              <div className="px-4 py-2">
                {logs.combined.map((entry, i) => (
                  <Entry key={i} entry={entry} showLevel={true} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8 text-sm">No log entries</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
