import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Log lines can contain emails and other sensitive metadata, so the viewer is
// only available outside production unless explicitly enabled.
const logViewerEnabled =
  process.env.NODE_ENV !== 'production' || process.env.ENABLE_LOG_VIEWER === 'true';

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
    errors: readLogFile(LOG_FILES.errors, limit),
    combined: readLogFile(LOG_FILES.combined, limit),
    count: limit,
  });
});

export default router;
