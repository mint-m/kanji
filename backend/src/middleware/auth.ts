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

/**
 * Enhanced JWT Authentication Middleware
 * Validates JWT token and attaches user info to request
 */
export const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header (support multiple formats)
    const authHeader = req.header('Authorization');
    let token: string | null = null;

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).replace(/"/g, ''); // Remove quotes if present
      } else if (authHeader.startsWith('Token ')) {
        token = authHeader.slice(6).replace(/"/g, '');
      }
    }

    // Also check for token in cookies or query (for WebSocket connections)
    if (!token) {
      token = req.cookies?.token || (req.query.token as string) || null;
    }

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

    // Update last active time (async, don't wait)
    setImmediate(async () => {
      try {
        user.updateLastActive();
        await user.save();
      } catch (error) {
        console.error('Failed to update last active time:', error);
      }
    });

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
 * Session-based Authentication Middleware (Alternative)
 * For applications using session-based authentication
 */
export const authenticateSession = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // Check if user is authenticated via session
  if (req.session && (req.session as any).userId) {
    // You could also fetch user details from session or database here
    req.user = {
      _id: new mongoose.Types.ObjectId((req.session as any).userId),
      email: (req.session as any).userEmail || '',
      name: (req.session as any).userName || '',
      type: (req.session as any).userType || 'local',
    };
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
    });
  }
};

/**
 * Enhanced Optional Authentication Middleware
 * Attaches user info if token is present, but doesn't require authentication
 */
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from multiple sources
    const authHeader = req.header('Authorization');
    let token: string | null = null;

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).replace(/"/g, '');
      } else if (authHeader.startsWith('Token ')) {
        token = authHeader.slice(6).replace(/"/g, '');
      }
    }

    if (!token) {
      token = req.cookies?.token || (req.query.token as string) || null;
    }

    if (token && config.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;

        const user = await User.findById(decoded.userId).select('+isActive');
        if (user && user.isActive) {
          // Update last active time (async, don't wait)
          setImmediate(async () => {
            try {
              user.updateLastActive();
              await user.save();
            } catch (error) {
              console.error('Failed to update last active time:', error);
            }
          });

          req.user = {
            _id: user._id as mongoose.Types.ObjectId,
            email: user.email,
            name: user.name,
            type: user.type,
          };
        }
      } catch (error) {
        // Silently ignore token errors in optional auth
        console.debug('Optional auth token error:', error);
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if any error occurs
    next();
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required permissions
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!roles.includes(req.user.type)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions.',
      });
      return;
    }

    next();
  };
};

/**
 * Enhanced Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number; lastAttempt: number }>();

  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of Array.from(attempts.entries())) {
      if (now > data.resetTime + windowMs) {
        attempts.delete(key);
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Use multiple identifiers for more robust rate limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
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
 * Token refresh middleware
 * Checks if token is close to expiry and issues new one
 */
export const refreshTokenIfNeeded = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next();
    }

    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token && config.JWT_SECRET) {
      const decoded = jwt.decode(token) as TokenPayload;

      if (decoded?.exp) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp - now;

        // If token expires in less than 1 hour, issue a new one
        if (timeUntilExpiry < 3600) {
          const user = await User.findById(req.user._id);
          if (user) {
            const { generateToken } = await import('../services/auth');
            const newToken = generateToken(user);

            res.set('X-New-Token', newToken);
            res.set('X-Token-Refresh', 'true');
          }
        }
      }
    }

    next();
  } catch (error) {
    console.error('Token refresh error:', error);
    next(); // Continue even if refresh fails
  }
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

/**
 * IP whitelist middleware (for admin routes)
 */
export const ipWhitelist = (allowedIPs: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (allowedIPs.length === 0) {
      return next(); // No restrictions if no IPs specified
    }

    const clientIP = req.ip || req.connection.remoteAddress || '';
    const isAllowed = allowedIPs.some((ip) => {
      if (ip.includes('/')) {
        // CIDR notation support (basic)
        const [network, prefixLength] = ip.split('/');
        return clientIP.startsWith(
          network
            .split('.')
            .slice(0, parseInt(prefixLength) / 8)
            .join('.')
        );
      }
      return clientIP === ip;
    });

    if (!isAllowed) {
      res.status(403).json({
        success: false,
        message: 'Access denied from this IP address.',
        code: 'IP_BLOCKED',
      });
      return;
    }

    next();
  };
};

export default {
  authenticateUser,
  authenticateSession,
  optionalAuth,
  requireRole,
  authRateLimit,
  refreshTokenIfNeeded,
  securityHeaders,
  ipWhitelist,
};
