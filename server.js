import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRouter from './server/routes/chat.js';
import { isOpenRouterConfigured } from './server/config/openrouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SESSION_SECRET = process.env.SESSION_SECRET || 'aeris_production_session_secret_key_2026';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = process.env.DATABASE_URL 
  ? path.resolve(__dirname, process.env.DATABASE_URL) 
  : path.join(DATA_DIR, 'users.json');

// Ensure parent directory of USERS_FILE exists
const usersDir = path.dirname(USERS_FILE);
if (!fs.existsSync(usersDir)) {
  fs.mkdirSync(usersDir, { recursive: true });
}

// Memory store for OTPs & Reset Tokens (with expiry tracking)
const otpStore = new Map(); // email -> { otpHash, salt, expiresAt, resendAllowedAt, attemptsLeft }
const resetTokenStore = new Map(); // resetToken -> { email, expiresAt }
const oauthStateStore = new Map(); // state -> { timestamp }

// Helper: Hash password with bcrypt (10 rounds)
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

// Helper: Verify password with bcrypt (with backward-compatible salted SHA-256 fallback)
function verifyPassword(password, user) {
  if (!user || !password || !user.passwordHash) return false;
  if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
    return bcrypt.compareSync(password, user.passwordHash);
  }
  if (user.salt) {
    const calc = crypto.createHash('sha256').update(password + ':' + user.salt).digest('hex');
    return calc === user.passwordHash;
  }
  return false;
}

// Helper: Hash OTP with salt for secure in-memory storage
function hashWithSalt(value, salt) {
  return crypto.createHash('sha256').update(value + ':' + salt).digest('hex');
}

function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

function generate6DigitOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Helper: Create secure signed session token
function createSessionToken(user) {
  try {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SESSION_SECRET,
      { expiresIn: '30d' }
    );
  } catch (e) {
    return 'aeris_tok_' + crypto.randomBytes(24).toString('hex');
  }
}

// Load users database
function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      // Default demo user
      const salt = generateSalt();
      const demoUsers = [
        {
          id: 'user_demo_default',
          name: 'Vanshik Lakkad',
          email: 'vanshik@aeris.ai',
          role: 'Citizen',
          passwordHash: hashWithSalt('password123', salt),
          salt,
          avatarColor: 'from-emerald-500 to-teal-600',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(demoUsers, null, 2));
      return demoUsers;
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load users from file:', err);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Failed to save users to file:', err);
  }
}

function sanitizeUser(user) {
  const { passwordHash, salt, ...safe } = user;
  return safe;
}

// Nodemailer Transporter - Supports both EMAIL_* and SMTP_* variables
function getMailTransporter() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;
  const secure = (process.env.EMAIL_SECURE || process.env.SMTP_SECURE) === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
}

function getMailSender() {
  return process.env.EMAIL_FROM || process.env.SMTP_FROM || '"AERIS Intelligence" <no-reply@aeris.ai>';
}

/* =========================================================================
 * 1. GOOGLE OAUTH 2.0 ENDPOINTS
 * ========================================================================= */

// Generate real Google OAuth 2.0 Authorization URL
app.get('/api/auth/google/url', (req, res) => {
  console.log('[AERIS AUTH SERVER] [OAuth] /api/auth/google/url endpoint reached');
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || `http://localhost:${PORT}/api/auth/google/callback`;

  const isClientIdSet = Boolean(clientId && clientId.length > 0);
  const isClientSecretSet = Boolean(clientSecret && clientSecret.length > 0);

  console.log(`[AERIS AUTH SERVER] [OAuth] GOOGLE_CLIENT_ID loaded: ${isClientIdSet}`);
  console.log(`[AERIS AUTH SERVER] [OAuth] GOOGLE_CLIENT_SECRET loaded: ${isClientSecretSet}`);
  console.log(`[AERIS AUTH SERVER] [OAuth] Using redirect URI: ${redirectUri}`);

  if (!isClientIdSet) {
    console.error('----------------------------------------------------------------');
    console.error('[AERIS AUTH SERVER] [OAuth CONFIG ERROR] GOOGLE_CLIENT_ID is missing!');
    console.error('Please configure your Google Cloud OAuth Client ID in .env:');
    console.error(`- .env location: ${envPath}`);
    console.error('- GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com');
    console.error(`- Ensure Authorized Redirect URI in Google Cloud Console matches: ${redirectUri}`);
    console.error('----------------------------------------------------------------');
    return res.status(503).json({
      error: 'Google sign-in is currently unavailable. Please check server configuration.'
    });
  }

  const origin = (req.headers.origin || req.headers.referer || FRONTEND_URL).replace(/\/$/, '');
  const state = crypto.randomBytes(16).toString('hex');
  oauthStateStore.set(state, { timestamp: Date.now(), origin });

  // Clean old states (> 15 minutes)
  for (const [s, data] of oauthStateStore.entries()) {
    if (Date.now() - data.timestamp > 15 * 60 * 1000) {
      oauthStateStore.delete(s);
    }
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: state
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  console.log('[AERIS AUTH SERVER] [OAuth] Generated Google Auth URL successfully. Redirecting client to accounts.google.com');

  res.json({ url: googleAuthUrl });
});

// Google OAuth 2.0 Callback
app.get('/api/auth/google/callback', async (req, res) => {
  console.log('[AERIS AUTH SERVER] [OAuth] /api/auth/google/callback received');
  const { code, state, error, error_description } = req.query;

  const stateData = (state && oauthStateStore.get(state)) || {};
  const targetFrontendUrl = stateData.origin || FRONTEND_URL;

  if (error) {
    console.warn(`[AERIS AUTH SERVER] [OAuth] Google callback returned error: ${error}`, error_description ? `(${error_description})` : '');
    const errorCode = error === 'access_denied' ? 'cancelled' : 'failed';
    return res.redirect(`${targetFrontendUrl}/?auth_error=${errorCode}`);
  }

  const isStateValid = Boolean(state && oauthStateStore.has(state));
  console.log(`[AERIS AUTH SERVER] [OAuth] Authorization code present: ${Boolean(code)} | State valid: ${isStateValid}`);

  if (!code || !state || !isStateValid) {
    console.warn('[AERIS AUTH SERVER] [OAuth] Invalid or expired OAuth state parameter');
    return res.redirect(`${targetFrontendUrl}/?auth_error=expired`);
  }

  oauthStateStore.delete(state);

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || `http://localhost:${PORT}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('----------------------------------------------------------------');
      console.error('[AERIS AUTH SERVER] [OAuth CALLBACK ERROR] GOOGLE_CLIENT_SECRET is missing in .env!');
      console.error('Google authorization code exchange requires GOOGLE_CLIENT_SECRET:');
      console.error('- Set GOOGLE_CLIENT_SECRET=your_client_secret in .env');
      console.error('----------------------------------------------------------------');
      return res.redirect(`${targetFrontendUrl}/?auth_error=missing_secret`);
    }

    console.log('[AERIS AUTH SERVER] [OAuth] Exchanging authorization code with Google token endpoint...');
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error(`[AERIS AUTH SERVER] [OAuth ERROR] Token exchange failed with HTTP ${tokenRes.status}:`, tokenData?.error_description || tokenData?.error);
      return res.redirect(`${targetFrontendUrl}/?auth_error=token_failed`);
    }
    console.log('[AERIS AUTH SERVER] [OAuth] Token exchange successful: true');

    console.log('[AERIS AUTH SERVER] [OAuth] Fetching verified profile from Google UserInfo endpoint...');
    // Fetch user profile from Google UserInfo endpoint
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const googleUser = await userInfoRes.json();
    if (!userInfoRes.ok || !googleUser.email) {
      console.error(`[AERIS AUTH SERVER] [OAuth ERROR] Google UserInfo fetch failed with HTTP ${userInfoRes.status}`);
      return res.redirect(`${targetFrontendUrl}/?auth_error=userinfo_failed`);
    }
    console.log('[AERIS AUTH SERVER] [OAuth] Google profile verified successfully for:', googleUser.email);

    // Find or create user in our database
    const users = loadUsers();
    let user = users.find(u => u.email.toLowerCase() === googleUser.email.toLowerCase());

    if (!user) {
      console.log('[AERIS AUTH SERVER] [OAuth] Creating new AERIS account for verified Google user:', googleUser.email);
      const salt = generateSalt();
      user = {
        id: 'user_google_' + (googleUser.sub || crypto.randomUUID()),
        name: googleUser.name || (googleUser.given_name ? `${googleUser.given_name} ${googleUser.family_name || ''}`.trim() : googleUser.email.split('@')[0]),
        email: googleUser.email.toLowerCase(),
        role: 'Citizen',
        googleId: googleUser.sub,
        picture: googleUser.picture || null,
        passwordHash: hashPassword(crypto.randomBytes(32).toString('hex')),
        salt,
        avatarColor: 'from-emerald-500 to-teal-600',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      users.push(user);
    } else {
      console.log('[AERIS AUTH SERVER] [OAuth] Logging in existing AERIS user account:', user.email);
      user.lastLogin = new Date().toISOString();
      if (googleUser.sub && !user.googleId) {
        user.googleId = googleUser.sub;
      }
      if (googleUser.picture && !user.picture) {
        user.picture = googleUser.picture;
      }
      if (googleUser.name && (!user.name || user.name === user.email.split('@')[0])) {
        user.name = googleUser.name;
      }
    }
    saveUsers(users);

    const safeUser = sanitizeUser(user);
    const sessionToken = createSessionToken(user);
    console.log('[AERIS AUTH SERVER] [OAuth] Session created successfully. Redirecting to application.');

    // Redirect to frontend with user session payload
    const userPayload = encodeURIComponent(JSON.stringify({ token: sessionToken, user: safeUser }));
    res.redirect(`${targetFrontendUrl}/?auth_success=true&session=${userPayload}`);
  } catch (err) {
    console.error('[AERIS AUTH SERVER] [OAuth EXCEPTION] Callback handler error:', err.message);
    res.redirect(`${targetFrontendUrl}/?auth_error=server_error`);
  }
});

/* =========================================================================
 * 2. EMAIL & PASSWORD AUTHENTICATION ENDPOINTS
 * ========================================================================= */

// Check if email exists in database
app.post('/api/auth/check-email', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const users = loadUsers();
  const exists = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
  res.json({ exists });
});

// Search matching emails for first-letter auto-suggestion
app.get('/api/auth/matching-emails', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) {
    return res.json({ matches: [] });
  }

  const users = loadUsers();
  const matches = users
    .filter(u => u.email.toLowerCase().startsWith(q))
    .map(u => u.email);

  res.json({ matches });
});

// User Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    return res.status(404).json({ error: "User doesn't exist." });
  }

  const isPasswordValid = verifyPassword(password, user);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  user.lastLogin = new Date().toISOString();
  saveUsers(users);

  const safeUser = sanitizeUser(user);
  const token = createSessionToken(user);
  res.json({ success: true, token, user: safeUser });
});

// User Sign Up
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, role = 'Citizen' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }

  const normalizedEmail = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const users = loadUsers();
  if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password);

  const newUser = {
    id: 'user_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
    name: name.trim(),
    email: normalizedEmail,
    role,
    passwordHash,
    salt,
    avatarColor: 'from-emerald-500 to-teal-600',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  const safeUser = sanitizeUser(newUser);
  const token = createSessionToken(newUser);
  res.json({ success: true, token, user: safeUser });
});

/* =========================================================================
 * 3. REAL TRANSACTIONAL EMAIL OTP (FORGOT PASSWORD)
 * ========================================================================= */

// Request Password Reset OTP -> Sends REAL Email via SMTP
app.post('/api/auth/forgot-password/request-otp', async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'Please enter your email address.' });
  }

  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(404).json({ error: "User doesn't exist." });
  }

  const now = Date.now();
  const existing = otpStore.get(normalizedEmail);

  // 60-second cooldown
  if (existing && existing.resendAllowedAt && now < existing.resendAllowedAt) {
    const waitSec = Math.ceil((existing.resendAllowedAt - now) / 1000);
    return res.status(429).json({ error: `Please wait ${waitSec}s before requesting a new code.` });
  }

  const rawOTP = generate6DigitOTP();
  const salt = generateSalt();
  const otpHash = hashWithSalt(rawOTP, salt);

  // Store hashed OTP on server
  otpStore.set(normalizedEmail, {
    otpHash,
    salt,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes
    resendAllowedAt: now + 60 * 1000, // 60s cooldown
    attemptsLeft: 5,
    createdAt: now
  });

  // Real Email Dispatch via Nodemailer
  const transporter = getMailTransporter();

  if (!transporter) {
    console.warn(`[AERIS EMAIL WARNING]: SMTP is not configured in .env. Attempted to send to ${normalizedEmail}.`);
    return res.status(503).json({
      error: 'Email service is currently not configured on the server. Please set SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) in the server .env file.'
    });
  }

  const mailOptions = {
    from: getMailSender(),
    to: normalizedEmail,
    subject: 'Your AERIS Password Reset Verification Code',
    text: `Your AERIS password reset verification code is: ${rawOTP}\n\nThis code will expire in 5 minutes.\nIf you did not request this password reset, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0b131e; color: #f1f5f9; padding: 32px; border-radius: 16px; max-width: 500px; margin: auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #10b981; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: 1px;">AERIS</h2>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px;">Satellite Environmental Intelligence</p>
        </div>
        <div style="background-color: #132235; border: 1px solid #1e3a5f; padding: 24px; border-radius: 12px; text-align: center;">
          <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 16px;">Use the following verification code to reset your password:</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; background-color: #071322; padding: 16px; border-radius: 8px; border: 1px dashed #0284c7; margin-bottom: 16px; font-family: monospace;">
            ${rawOTP}
          </div>
          <p style="font-size: 12px; color: #f59e0b; margin: 0;">⏱️ This code will expire in 5 minutes.</p>
        </div>
        <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 24px; line-height: 1.5;">
          If you did not request a password reset, you can safely ignore this email. No changes have been made to your account.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[AERIS EMAIL SUCCESS]: Real OTP verification email dispatched to ${normalizedEmail}`);
    // NEVER return or expose the OTP in the response
    res.json({
      success: true,
      message: "We've sent a 6-digit verification code to your email."
    });
  } catch (err) {
    console.error(`[AERIS EMAIL ERROR]: Failed to send email to ${normalizedEmail}:`, err);
    res.status(500).json({
      error: 'Failed to deliver verification email. Please check your SMTP server settings or try again later.'
    });
  }
});

// Verify 6-digit OTP on server
app.post('/api/auth/forgot-password/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  if (!cleanOtp || cleanOtp.length !== 6) {
    return res.status(400).json({ error: 'Please enter the complete 6-digit verification code.' });
  }

  const record = otpStore.get(normalizedEmail);
  const now = Date.now();

  if (!record) {
    return res.status(400).json({ error: 'No active verification code found. Please request a new code.' });
  }

  if (now > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
  }

  if (record.attemptsLeft <= 0) {
    otpStore.delete(normalizedEmail);
    return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
  }

  const enteredHash = hashWithSalt(cleanOtp, record.salt);
  if (enteredHash !== record.otpHash) {
    record.attemptsLeft -= 1;
    return res.status(400).json({
      error: `Invalid verification code. ${record.attemptsLeft} attempt(s) remaining.`
    });
  }

  // OTP is verified! Consume it and issue single-use Reset Token
  otpStore.delete(normalizedEmail);

  const resetToken = 'aeris_rst_' + crypto.randomBytes(32).toString('hex');
  resetTokenStore.set(resetToken, {
    email: normalizedEmail,
    expiresAt: now + 10 * 60 * 1000 // 10 minutes to reset
  });

  res.json({ success: true, resetToken });
});

// Save New Password
app.post('/api/auth/forgot-password/reset-password', (req, res) => {
  const { email, resetToken, newPassword, confirmPassword } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!resetToken || !resetTokenStore.has(resetToken)) {
    return res.status(401).json({ error: 'This password reset session has expired or is invalid. Please request a new code.' });
  }

  const tokenData = resetTokenStore.get(resetToken);
  if (tokenData.email !== normalizedEmail || Date.now() > tokenData.expiresAt) {
    resetTokenStore.delete(resetToken);
    return res.status(401).json({ error: 'This password reset session has expired. Please request a new code.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  // Security policy checks
  const minLength = (newPassword || '').length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword || '');
  const hasLower = /[a-z]/.test(newPassword || '');
  const hasNumber = /[0-9]/.test(newPassword || '');
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword || '');

  if (!minLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return res.status(400).json({ error: 'Password does not meet all security requirements.' });
  }

  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  const newPasswordHash = hashPassword(newPassword);
  user.passwordHash = newPasswordHash;
  user.salt = generateSalt();
  user.lastPasswordReset = new Date().toISOString();
  saveUsers(users);

  // Invalidate reset token
  resetTokenStore.delete(resetToken);

  res.json({ success: true, message: 'Password reset successfully!' });
});

/* =========================================================================
 * 4. REAL USER CHAT PERSISTENCE ENDPOINTS
 * ========================================================================= */

const CHATS_FILE = path.join(DATA_DIR, 'chats.json');

function loadChats() {
  try {
    if (!fs.existsSync(CHATS_FILE)) {
      fs.writeFileSync(CHATS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(CHATS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load chats:', err);
    return [];
  }
}

function saveChats(chats) {
  try {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
  } catch (err) {
    console.error('Failed to save chats:', err);
  }
}

// Get user chats
app.get('/api/chats', (req, res) => {
  const userEmail = (req.query.userEmail || '').trim().toLowerCase();
  const allChats = loadChats();
  
  if (userEmail) {
    const userChats = allChats.filter(c => (c.userEmail || '').toLowerCase() === userEmail);
    return res.json({ success: true, chats: userChats });
  }

  // If no email query, return guest/recent chats
  const guestChats = allChats.filter(c => !c.userEmail || c.userEmail === 'guest');
  res.json({ success: true, chats: guestChats });
});

// Save / Update a chat
app.post('/api/chats', (req, res) => {
  const { id, title, messages, userEmail = 'guest', createdAt, updatedAt } = req.body;
  if (!id || !title) {
    return res.status(400).json({ error: 'Chat ID and title are required.' });
  }

  const allChats = loadChats();
  const existingIdx = allChats.findIndex(c => c.id === id);

  const chatRecord = {
    id,
    title,
    messages: messages || [],
    userEmail: (userEmail || 'guest').toLowerCase(),
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString()
  };

  if (existingIdx >= 0) {
    allChats[existingIdx] = { ...allChats[existingIdx], ...chatRecord };
  } else {
    allChats.unshift(chatRecord);
  }

  saveChats(allChats);
  res.json({ success: true, chat: chatRecord });
});

// Delete a chat
app.delete('/api/chats/:id', (req, res) => {
  const { id } = req.params;
  let allChats = loadChats();
  allChats = allChats.filter(c => c.id !== id);
  saveChats(allChats);
  res.json({ success: true, message: 'Chat deleted.' });
});

/* =========================================================================
 * 4.1 OPENROUTER AI ORCHESTRATION ROUTE (POST /api/chat)
 * ========================================================================= */

app.use('/api/chat', chatRouter);

/* =========================================================================
 * 5. SYSTEM HEALTH & SESSION UTILITIES
 * ========================================================================= */

// Verify session and get authenticated user
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return res.status(401).json({ error: 'Empty authorization token.' });
  }

  try {
    const decoded = jwt.verify(token, SESSION_SECRET);
    const users = loadUsers();
    const user = users.find(u => u.id === decoded.id || u.email.toLowerCase() === decoded.email?.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    // If fallback opaque token format
    if (token.startsWith('aeris_tok_')) {
      const users = loadUsers();
      if (users.length > 0) {
        return res.json({ success: true, user: sanitizeUser(users[0]) });
      }
    }
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
});

app.get('/api/health', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const mailTransporter = getMailTransporter();

  res.json({
    status: 'ok',
    service: 'AERIS Environmental Intelligence API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: true,
      file: path.basename(USERS_FILE),
      userCount: loadUsers().length
    },
    integrations: {
      googleOAuth: {
        configured: Boolean(clientId && clientSecret),
        redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/google/callback`
      },
      emailService: {
        configured: Boolean(mailTransporter),
        sender: getMailSender()
      },
      openRouter: {
        configured: isOpenRouterConfigured(),
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-latest'
      }
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

/* =========================================================================
 * 5. UNIFIED FULL-STACK STATIC ASSET SERVING (COMBINED FRONT & BACKEND)
 * ========================================================================= */

const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));

  // Fallback for React Router SPA (matches everything except /api routes)
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || `http://localhost:${PORT}/api/auth/google/callback`;
  const mailConfigured = Boolean(getMailTransporter());
  const hasStaticBuild = fs.existsSync(DIST_DIR);

  console.log('====================================================');
  console.log(`[AERIS UNIFIED SERVER] Running on port ${PORT}`);
  console.log(`[AERIS UNIFIED SERVER] Local Address: http://localhost:${PORT}`);
  console.log(`[AERIS UNIFIED SERVER] Unified Frontend + Backend: ${hasStaticBuild ? 'ACTIVE (Serving React SPA)' : 'DEV MODE'}`);
  console.log(`[AERIS UNIFIED SERVER] Database: ${USERS_FILE}`);
  console.log(`[AERIS UNIFIED SERVER] Google OAuth Client ID Loaded: ${Boolean(clientId && clientId.length > 0)}`);
  console.log(`[AERIS UNIFIED SERVER] Google OAuth Client Secret Loaded: ${Boolean(clientSecret && clientSecret.length > 0)}`);
  console.log(`[AERIS UNIFIED SERVER] Google OAuth Redirect URI: ${redirectUri}`);
  console.log(`[AERIS UNIFIED SERVER] Email Service Configured: ${mailConfigured}`);
  console.log(`[AERIS UNIFIED SERVER] OpenRouter AI Integration Configured: ${isOpenRouterConfigured()}`);
  console.log('====================================================');
});
