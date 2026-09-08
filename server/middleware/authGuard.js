import { supabase } from '../config/supabase.js';

/**
 * Supabase Authentication Guard Middleware
 * 
 * Enforces identity verification by inspecting the HTTP Authorization header.
 * Expected format: "Authorization: Bearer <token>"
 * 
 * Validates the token against Supabase Auth via supabase.auth.getUser(token).
 * If valid, attaches the verified Supabase Auth user record to `req.user`.
 * Rejects with HTTP 401 if the header is missing, malformed, expired, or invalid.
 * 
 * Strictly ignores any untrusted client-supplied identity fields in req.body,
 * req.query, or req.params.
 */
export async function authGuard(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization header provided.'
        }
      });
    }

    const parts = authHeader.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Malformed authorization header. Expected "Bearer <token>".'
        }
      });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Empty authorization token provided.'
        }
      });
    }

    // Authenticate token using Supabase Auth
    const { data: { user } = {}, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication failed. Token is invalid or expired.'
        }
      });
    }

    // Attach verified Supabase user record to request
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication request could not be processed.'
      }
    });
  }
}

export default authGuard;
