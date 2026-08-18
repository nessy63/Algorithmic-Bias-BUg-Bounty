import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Log lines can contain sensitive metadata, so the viewer is strictly opt-in
// and never auto-enabled — not even in development.
const logViewerEnabled = process.env.ENABLE_LOG_VIEWER === 'true';

const LOG_FILES = {
  errors: 'logs/error.log',
  combined: 'logs/combined.log',
} as const;

interface LogEntry {
  timestamp?: string;
  level?: string;
  message?: string;
  [key: string]: unknown;
}

// Defense-in-depth: strip any personal data that may still reach log files
// (emails, tokens, IPs, passwords) before serving them over the API.
const SENSITIVE_KEYS = /(email|mail|token|password|passwd|phone|ip|address|secret|authorization|cookie|stripe)/i;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const JWT_RE = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(EMAIL_RE, '[REDACTED]').replace(JWT_RE, '[REDACTED]');
  }
  if (value && typeof value === 'object') {
    return sanitizeEntry(value as Record<string, unknown>);
  }
  return value;
}

function sanitizeEntry(entry: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entry)) {
    out[key] = SENSITIVE_KEYS.test(key) ? '[REDACTED]' : sanitizeValue(value);
  }
  return out;
}

function readLogFile(filePath: string, limit: number): LogEntry[] {
  try {
    const content = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
    const entries: LogEntry[] = [];

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const parsed = JSON.parse(trimmed) as LogEntry;
        entries.push(parsed);
      } catch {
        // Non-JSON lines (e.g. winston console-only output) are skipped.
      }
    }

    // Newest first, capped at the requested limit.
    return entries.reverse().slice(0, limit);
  } catch {
    return [];
  }
}

// GET /api/logs?limit=100
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  if (!logViewerEnabled) {
    return res.status(403).json({ error: 'Log viewer is disabled' });
  }

  const limit = Math.min(
    Math.max(parseInt(req.query.limit as string, 10) || 100, 1),
    500
  );

  res.json({
    errors: readLogFile(LOG_FILES.errors, limit).map(sanitizeEntry),
    combined: readLogFile(LOG_FILES.combined, limit).map(sanitizeEntry),
    count: limit,
  });
});

export default router;
