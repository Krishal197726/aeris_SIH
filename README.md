# AERIS — Planetary Environmental Intelligence System

AERIS is a real-time atmospheric, climate, and environmental intelligence platform featuring real Google OAuth 2.0 authentication, salted password cryptography, transactional Nodemailer email delivery, 3D interactive planetary visualization, live weather layers, and persona-driven AI environmental synthesis.

---

## 🏗️ Project Architecture

```
AERIS/
├── data/
│   └── users.json            # Persistent JSON database
├── public/                   # Static assets
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthModal.jsx # Multi-screen auth modal (Google, Email, OTP, Reset)
│   │   ├── layout/
│   │   │   ├── Header.jsx    # Top navigation & user session profile
│   │   │   ├── Sidebar.jsx   # Page navigation & Persona selector
│   │   │   └── AppLayout.jsx # Master layout wrapper
│   │   └── map/              # 3D Globe & interactive spatial layers
│   ├── context/
│   │   ├── AuthContext.jsx   # Global session & authentication state
│   │   └── PersonaContext.jsx# Persona state (Citizen, Meteorologist, etc.)
│   ├── pages/
│   │   ├── ChatPage.jsx      # AI Environmental Chat interface
│   │   ├── MapPage.jsx       # Geospatial planetary analysis
│   │   ├── AlertsPage.jsx    # Severe weather alert feed
│   │   ├── ClimatePage.jsx   # Climate trends & analytics
│   │   ├── LibraryPage.jsx   # Research datasets & resources
│   │   └── SettingsPage.jsx  # System configurations
│   ├── services/
│   │   ├── authService.js    # Client-side API service (Zero client simulation)
│   │   └── aiService.js      # Environmental AI simulation engine
│   ├── App.jsx               # Application routes & provider setup
│   ├── main.jsx              # React 19 root entry
│   └── index.css             # Tailwind v4 design system
├── .env                      # Local environment secrets (ignored by git)
├── .env.example              # Environment template
├── .gitignore                # Security exclusion list
├── package.json              # Project scripts & dependencies
├── server.js                 # Express backend API & OAuth 2.0 engine
├── vite.config.js            # Vite build & proxy configuration
└── README.md                 # Project documentation
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

### 3. Run Locally

**Start the Backend Express API Server (Port 5000):**
```bash
npm run server
# or: node server.js
```

**Start the Frontend Vite Development Server (Port 3000):**
```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Environment Variables Reference

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |
| `SESSION_SECRET` | Session signature secret | `your_secret_key` |
| `DATABASE_URL` | File path for persistent database | `data/users.json` |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth 2.0 Client ID | `your_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| Google Cloud OAuth 2.0 Client Secret | `your_secret` |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL | `http://localhost:5000/api/auth/google/callback` |
| `EMAIL_HOST` / `SMTP_HOST` | SMTP server host (e.g., Gmail) | `smtp.gmail.com` |
| `EMAIL_PORT` / `SMTP_PORT` | SMTP server port | `587` |
| `EMAIL_SECURE` | Use SSL/TLS | `false` |
| `EMAIL_USER` / `SMTP_USER` | SMTP username / email address | `your_email@gmail.com` |
| `EMAIL_PASSWORD` / `SMTP_PASS` | SMTP password / App password | `your_16_char_app_password` |
| `EMAIL_FROM` / `SMTP_FROM` | Sender display name & email | `"AERIS Intelligence" <no-reply@aeris.ai>` |

---

## 🌐 Google Cloud OAuth 2.0 Setup

1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** with Application Type **Web application**.
3. Set **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `http://localhost:5000`
4. Set **Authorized redirect URIs**:
   - `http://localhost:5000/api/auth/google/callback`
5. Save the generated **Client ID** and **Client Secret** into `.env`.

---

## 📧 Real Email OTP Setup (Gmail Example)

1. Enable **2-Step Verification** on your Google account.
2. Go to **Google Account Settings → Security → 2-Step Verification → App passwords**.
3. Generate a 16-character App Password for "Mail".
4. Add to `.env`:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_16_char_app_password
   ```

---

## 🔒 Security Architecture

- **No Frontend Secrets**: `GOOGLE_CLIENT_SECRET`, SMTP passwords, and database hashes are never sent to or stored in client-side code.
- **Salted Password Hashing**: Passwords are saved with unique cryptographic salts (`crypto.randomBytes(16)`) and SHA-256 hashes.
- **Zero Client-Side Simulation**: Real transactional emails are sent via Nodemailer. OTPs are stored hashed on the server with a 5-minute expiration and 60-second resend cooldown.
