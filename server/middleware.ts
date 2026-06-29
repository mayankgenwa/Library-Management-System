import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'librarian' | 'member';
  };
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: 'librarian' | 'member' };
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
}

export function roleMiddleware(allowedRole: 'librarian' | 'member') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
      return;
    }

    if (user.role !== allowedRole) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Only ${allowedRole}s are allowed to perform this action.`,
      });
      return;
    }

    next();
  };
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error handler caught:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}
