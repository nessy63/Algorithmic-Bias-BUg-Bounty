import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth';
import { AuthRequest, AuthUser } from '../types';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Prefer the httpOnly cookie (set at login/register). The Authorization
  // header is still accepted for API clients and backward compatibility.
  const token =
    (req.cookies?.token as string | undefined) ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : undefined);

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Admin-only gate for sensitive endpoints (e.g. the log viewer).
// Access is granted by an ADMIN role (set directly in the DB) or by listing
// the user's email in the ADMIN_EMAILS env var — no schema change required.
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const isAdminRole = req.user.role === 'ADMIN';
  const isAdminEmail = adminEmails.includes(req.user.email.toLowerCase());

  if (!isAdminRole && !isAdminEmail) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  next();
};
