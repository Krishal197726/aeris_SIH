/**
 * AERIS Authentication & Storage Service
 * Integrates with Supabase Auth for persistent session management,
 * while maintaining backward-compatible API contracts for modals and UI components.
 */

import { supabase } from '../lib/supabase.js';

const SESSION_STORAGE_KEY = 'aeris_auth_session';

/**
 * Compute 2-character uppercase initials from full name
 */
export function getInitials(name = '') {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Retrieve current active session user from localStorage (cached fallback)
 */
export function getCurrentSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.user || null;
  } catch (err) {
    console.error('Failed to read active session:', err);
    return null;
  }
}

/**
 * Save active session to localStorage (legacy compatibility layer)
 */
export function createActiveSession(token, user) {
  const sessionData = {
    token,
    user,
    createdAt: new Date().toISOString()
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
}

/**
 * Terminate active session (Log Out)
 * Clears both Supabase browser session and local cached storage.
 */
export async function destroySession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Failed to destroy session:', err);
  }
}

/**
 * Get current active Bearer token (Supabase access_token with localStorage fallback)
 */
export async function getAuthToken() {
  try {
    const { data: { session } = {} } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
  } catch (e) {
    // Ignore error and try localStorage fallback
  }

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const sessionData = JSON.parse(raw);
      return sessionData?.token || null;
    }
  } catch (e) {
    // Ignore error
  }

  return null;
}

/**
 * Centralized Authenticated Fetch Wrapper
 * Automatically attaches Authorization: Bearer <token> if an active session exists.
 */
export async function authFetch(url, options = {}) {
  const token = await getAuthToken();
  const headers = {
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

/**
 * Retrieve authenticated user profile from /api/auth/me using Bearer token
 */
export async function fetchCurrentUserProfile(token) {
  const authToken = token || await getAuthToken();
  if (!authToken) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data?.user || null;
  } catch (err) {
    console.warn('[AERIS AUTH SERVICE] /api/auth/me verification failed:', err.message);
    return null;
  }
}

/**
 * Check if URL contains Google OAuth callback payload or error
 */
export function handleOAuthRedirectSession() {
  try {
    const params = new URLSearchParams(window.location.search);
    
    // 1. Success Callback
    if (params.get('auth_success') === 'true' && params.get('session')) {
      const sessionData = JSON.parse(decodeURIComponent(params.get('session')));
      if (sessionData && sessionData.token && sessionData.user) {
        createActiveSession(sessionData.token, sessionData.user);
        window.history.replaceState({}, document.title, window.location.pathname);
        return { user: sessionData.user, error: null };
      }
    }

    // 2. Error Callback
    const authError = params.get('auth_error');
    if (authError) {
      window.history.replaceState({}, document.title, window.location.pathname);
      let message = 'Google sign-in is currently unavailable. Please try again later.';
      if (authError === 'cancelled' || authError === 'access_denied') {
        message = 'Google sign-in was cancelled.';
      }
      return { user: null, error: message };
    }
  } catch (err) {
    console.error('Failed to parse OAuth redirect session:', err);
  }
  return { user: null, error: null };
}

/**
 * Get Google OAuth Authorization URL from backend
 */
export async function getGoogleAuthUrl() {
  try {
    const res = await fetch('/api/auth/google/url');
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google sign-in is currently unavailable. Please try again later.');
    }
    return data.url;
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('network')) {
      throw err;
    }
    throw new Error('Google sign-in is currently unavailable. Please try again later.');
  }
}

/**
 * Check if a user with the given email exists in the database
 */
export async function checkUserExists(email) {
  if (!email || typeof email !== 'string') return false;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const res = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail })
    });
    const data = await res.json();
    return !!data.exists;
  } catch (err) {
    console.error('Failed to check user existence:', err);
    return false;
  }
}

/**
 * Find matching registered emails for the typed prefix
 */
export async function findMatchingEmails(query) {
  if (!query || typeof query !== 'string') return [];
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return [];

  try {
    const res = await fetch(`/api/auth/matching-emails?q=${encodeURIComponent(normalized)}`);
    const data = await res.json();
    return data.matches || [];
  } catch (err) {
    console.error('Failed to find matching emails:', err);
    return [];
  }
}

/**
 * Authenticate existing user with email and password
 */
export async function authenticateUser(email, password) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new Error('Please enter both email and password.');
  }

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, password })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Invalid email or password.');
  }

  // Establish Supabase browser session if session tokens returned
  if (data.session?.access_token && data.session?.refresh_token) {
    try {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
    } catch (sessionErr) {
      console.warn('[AERIS AUTH SERVICE] Failed to sync Supabase client session:', sessionErr.message);
    }
  }

  createActiveSession(data.token, data.user);
  return data.user;
}

/**
 * Register a new user
 */
export async function registerUser({ name, email, password, role = 'Citizen' }) {
  if (!name || !name.trim()) {
    throw new Error('Please provide your full name.');
  }

  const normalizedEmail = (email || '').trim().toLowerCase();
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password, role })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed.');
  }

  // Establish Supabase browser session if session tokens returned
  if (data.session?.access_token && data.session?.refresh_token) {
    try {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
    } catch (sessionErr) {
      console.warn('[AERIS AUTH SERVICE] Failed to sync Supabase client session:', sessionErr.message);
    }
  }

  createActiveSession(data.token, data.user);
  return data.user;
}

/* =========================================================================
 * REAL TRANSACTIONAL EMAIL OTP SERVICE (NO SIMULATION)
 * ========================================================================= */

/**
 * Request Password Reset OTP -> Dispatches REAL Email from Backend
 */
export async function requestPasswordResetOTP(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Please enter your registered email address.');
  }

  const res = await fetch('/api/auth/forgot-password/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send verification code.');
  }

  return {
    success: true,
    message: data.message || "We've sent a 6-digit verification code to your email.",
    expiresInSeconds: 300,
    cooldownSeconds: 60
  };
}

/**
 * Resend Password Reset OTP -> Generates new OTP & Dispatches REAL Email
 */
export async function resendPasswordResetOTP(email) {
  return requestPasswordResetOTP(email);
}

/**
 * Verify 6-digit OTP entered by user against server
 */
export async function verifyPasswordResetOTP(email, enteredOtp) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (enteredOtp || '').trim();

  if (!cleanOtp || cleanOtp.length !== 6) {
    throw new Error('Please enter the complete 6-digit verification code.');
  }

  const res = await fetch('/api/auth/forgot-password/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, otp: cleanOtp })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Invalid verification code.');
  }

  return {
    success: true,
    resetToken: data.resetToken
  };
}

/**
 * Validate password requirements
 */
export function validatePasswordRequirements(password) {
  const minLength = (password || '').length >= 8;
  const hasUpper = /[A-Z]/.test(password || '');
  const hasLower = /[a-z]/.test(password || '');
  const hasNumber = /[0-9]/.test(password || '');
  const hasSpecial = /[^A-Za-z0-9]/.test(password || '');

  const isValid = minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  return {
    isValid,
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial
  };
}

/**
 * Reset password using single-use reset token on backend
 */
export async function resetPasswordWithToken({ email, resetToken, newPassword, confirmPassword }) {
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (newPassword !== confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  const { isValid } = validatePasswordRequirements(newPassword);
  if (!isValid) {
    throw new Error('Password must meet all security requirements.');
  }

  const res = await fetch('/api/auth/forgot-password/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: normalizedEmail,
      resetToken,
      newPassword,
      confirmPassword
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update password.');
  }

  await destroySession();
  return {
    success: true,
    message: data.message || 'Password reset successfully!'
  };
}
