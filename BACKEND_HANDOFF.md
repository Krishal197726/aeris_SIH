# 🚀 AERIS — Backend Developer Handoff Guide

Welcome to the **AERIS (Atmospheric & Environmental Real-time Intelligence System)** codebase!

This document outlines the architecture, authentication mechanisms, data schemas, and API contracts for backend developers continuing development on AERIS.

---

## 🏗️ Architecture Overview

AERIS is a full-stack Node.js + Express 5 & React 19 application.

- **Frontend**: React 19, Tailwind CSS v4, Three.js 3D globe visualization (`dist/` production bundle).
- **Backend API**: Node.js + Express 5 (`server.js`).
- **Unified Server**: The Express server hosts both the REST API endpoints and static SPA frontend bundles on port `5000`.

---

## ⚡ Quick Start for Backend Devs

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the credentials:
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=aeris_auth_session_secret_key_2026
DATABASE_URL=data/users.json

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Transactional Email (Gmail / SendGrid / SES)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
EMAIL_FROM="AERIS Intelligence" <no-reply@aeris.ai>
```

### 3. Run the Unified Server
```bash
npm start
```
👉 Application runs at: **http://localhost:5000**  
👉 Health status at: **http://localhost:5000/api/health**

---

## 📡 Complete API Endpoints

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/check-email` | Check if email exists in database (`{ email }`). Returns `{ exists: boolean }`. |
| `GET` | `/api/auth/matching-emails?q=` | Prefix matching for email auto-suggestions. |
| `POST` | `/api/auth/login` | Email/password login with Bcrypt verification. Returns `{ success: true, token, user }`. |
| `POST` | `/api/auth/signup` | New user registration with Bcrypt (10 salt rounds). Returns `{ success: true, token, user }`. |
| `GET` | `/api/auth/google/url` | Generates official Google OAuth 2.0 authorization URL. |
| `GET` | `/api/auth/google/callback` | OAuth 2.0 callback, token exchange, user identity fetch & session creation. |
| `POST` | `/api/auth/forgot-password/request-otp` | Generates 6-digit cryptographic OTP and dispatches real SMTP email. |
| `POST` | `/api/auth/forgot-password/verify-otp` | Verifies OTP hash and issues a single-use password reset token. |
| `POST` | `/api/auth/forgot-password/reset-password` | Updates user password with new Bcrypt hash and invalidates reset token. |
| `GET` | `/api/auth/me` | Validates JWT/session token in `Authorization: Bearer <token>` header. |
| `POST` | `/api/auth/logout` | Clears active session. |

---

### 💬 Real User Chats (`/api/chats`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/chats?userEmail=` | Fetches persistent chat history for a specific user (or guest). |
| `POST` | `/api/chats` | Creates or updates a conversation thread (`{ id, title, messages, userEmail }`). |
| `DELETE` | `/api/chats/:id` | Deletes a conversation thread. |

---

### 🩺 System Diagnostics (`/api/health`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns server uptime, database user counts, and integration configuration flags. |

---

## 🗄️ Database & Storage Structure

- **Users**: [`data/users.json`](file:///c:/AERIS/data/users.json)
  - Fields: `id`, `name`, `email`, `role`, `passwordHash` (Bcrypt), `salt`, `googleId`, `picture`, `avatarColor`, `createdAt`, `lastLogin`.
- **Chats**: [`data/chats.json`](file:///c:/AERIS/data/chats.json)
  - Fields: `id`, `title`, `messages`, `userEmail`, `createdAt`, `updatedAt`.
