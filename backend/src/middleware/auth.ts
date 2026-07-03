import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/user';
import config from '../config';

// JWT Token Payload Interface
export interface TokenPayload {
  userId: string;
  email: string;
  type: string;
  iat?: number;
  exp?: number;
}

// Extend Request interface to include user - Global declaration for consistency
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: mongoose.Types.ObjectId;
        email: string;
        name: string;
        type: string;
      };
    }
  }
}

// AuthenticatedRequest type alias for convenience
export interface AuthenticatedRequest extends Request {
  user?: {
    _id: mongoose.Types.ObjectId;
    email: string;
    name: string;
    type: string;
  };
}

const extractToken = (req: Request): string | null => {
  const authHeader = req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7).replace(/"/g, '');
  return null;
};

export const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
        code: 'NO_TOKEN',
      });
      return;
    }

    // Verify token using config
    const JWT_SECRET = config.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        message: 'Server configuration error.',
        code: 'CONFIG_ERROR',
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Get user from database with proper error handling
    const user = await User.findById(decoded.userId).select('+isActive');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User account is deactivated.',
        code: 'ACCOUNT_DEACTIVATED',
      });
      return;
    }

    // Attach comprehensive user info to request
    req.user = {
      _id: user._id as mongoose.Types.ObjectId,
      email: user.email,
      name: user.name,
      type: user.type,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token format.',
        code: 'INVALID_TOKEN',
      });
    } else if (error instanceof jwt.NotBeforeError) {
      res.status(401).json({
        success: false,
        message: 'Token not active yet.',
        code: 'TOKEN_NOT_ACTIVE',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Authentication service error.',
        code: 'AUTH_ERROR',
      });
    }
  }
};

/**
 * Enhanced Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number; lastAttempt: number }>();

  // Clean up old entries periodically (unref: 이 타이머가 프로세스 종료를 막지 않도록)
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of Array.from(attempts.entries())) {
      if (now > data.resetTime + windowMs) {
        attempts.delete(key);
      }
    }
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    // Use multiple identifiers for more robust rate limiting
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const key = `${ip}:${userAgent.slice(0, 50)}`; // Limit UA length

    const now = Date.now();
    const userAttempts = attempts.get(key);

    if (userAttempts) {
      if (now > userAttempts.resetTime) {
        // Reset window
        attempts.set(key, { count: 1, resetTime: now + windowMs, lastAttempt: now });
      } else if (userAttempts.count >= maxAttempts) {
        const resetTimeRemaining = Math.ceil((userAttempts.resetTime - now) / 1000 / 60);
        res.status(429).json({
          success: false,
          message: `Too many authentication attempts. Please try again in ${resetTimeRemaining} minutes.`,
          code: 'RATE_LIMITED',
          retryAfter: userAttempts.resetTime,
        });
        return;
      } else {
        userAttempts.count++;
        userAttempts.lastAttempt = now;
      }
    } else {
      attempts.set(key, { count: 1, resetTime: now + windowMs, lastAttempt: now });
    }

    // Add remaining attempts to response headers
    const remaining = Math.max(0, maxAttempts - (userAttempts?.count || 0));
    res.set({
      'X-RateLimit-Limit': maxAttempts.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(userAttempts?.resetTime || now + windowMs).toISOString(),
    });

    next();
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });

  // CORS headers for JWT auth
  if (req.method === 'OPTIONS') {
    res.set({
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    });
  }

  next();
};

export default {
  authenticateUser,
  authRateLimit,
  securityHeaders,
};
