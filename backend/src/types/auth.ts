/**
 * Authentication Types
 *
 * Type definitions for authentication and authorization
 */

import { UserAuthType } from './common';

// ============================================================================
// OAuth Types
// ============================================================================

/**
 * Google OAuth user profile
 */
export interface GoogleUserProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

/**
 * OAuth token data
 */
export interface OAuthTokenData {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

// ============================================================================
// JWT Types
// ============================================================================

/**
 * JWT payload for authenticated users
 */
export interface JWTPayload {
  userId: string;
  email: string;
  type: UserAuthType;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

/**
 * Decoded JWT token
 */
export interface DecodedToken extends JWTPayload {
  iat: number;
  exp: number;
}

// ============================================================================
// Session Types
// ============================================================================

/**
 * User session data
 */
export interface UserSession {
  userId: string;
  email: string;
  name: string;
  type: UserAuthType;
  profilePicture?: string;
  sessionStarted: Date;
  lastActivity: Date;
  expiresAt: Date;
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  isValid: boolean;
  session?: UserSession;
  error?: string;
  requiresRefresh?: boolean;
}

// ============================================================================
// Authentication Request/Response Types
// ============================================================================

/**
 * Login credentials for local auth
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data for local auth
 */
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  success: boolean;
  user: {
    _id: string;
    email: string;
    name: string;
    type: UserAuthType;
    profilePicture?: string;
  };
  token: string;
  expiresIn: number; // seconds
}

/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
  success: boolean;
  token: string;
  expiresIn: number;
}

// ============================================================================
// Authorization Types
// ============================================================================

/**
 * User roles for role-based access control
 */
export type UserRole = 'user' | 'admin' | 'moderator';

/**
 * Permissions for fine-grained access control
 */
export type Permission =
  | 'read:own_data'
  | 'write:own_data'
  | 'delete:own_data'
  | 'read:all_data'
  | 'write:all_data'
  | 'delete:all_data'
  | 'manage:users'
  | 'manage:content';

/**
 * Authorization context
 */
export interface AuthContext {
  userId: string;
  roles: UserRole[];
  permissions: Permission[];
  email: string;
  type: UserAuthType;
}

/**
 * Access control check result
 */
export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
}

// ============================================================================
// Password Reset Types
// ============================================================================

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset token data
 */
export interface PasswordResetToken {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// Email Verification Types
// ============================================================================

/**
 * Email verification token
 */
export interface EmailVerificationToken {
  userId: string;
  token: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Email verification result
 */
export interface EmailVerificationResult {
  success: boolean;
  email: string;
  verifiedAt: Date;
  error?: string;
}
