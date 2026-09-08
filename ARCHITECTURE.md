# AERIS / WeatherGPT — Master Architecture & Integration Contract

> **AUTHORITATIVE GOVERNANCE DOCUMENT**  
> **Target Audience:** All 6 Engineering Subsystem Owners & Lead Architect  
> **Status:** Active Standard for AERIS / WeatherGPT Hackathon Project  
> **Rule:** *Before implementing any feature that touches another subsystem, read ARCHITECTURE.md and preserve the documented contracts.*

---

## 1. PROJECT OVERVIEW

### 1.1 What AERIS / WeatherGPT Is
**AERIS (Atmospheric & Environmental Real-time Intelligence System)** — branded as **WeatherGPT** — is a next-generation conversational environmental and weather intelligence platform engineered specifically for the Indian subcontinent. It bridges raw meteorological data streams (radar, satellite, numerical weather prediction models) with actionable, persona-tailored natural language advisories, interactive 3D visualizations, severe weather warnings, and agricultural decision support.

### 1.2 The WeatherGPT Problem Statement
Standard weather apps present raw metrics (e.g., "31°C, 78% humidity, 60% rain chance") that leave users asking: *"What does this mean for me?"*
- A **farmer** needs to know whether to run irrigation or postpone spraying pesticides to prevent run-off.
- A **disaster manager** needs actionable urban inundation estimates and SDRF team staging points.
- An **aviation/maritime pilot** needs cloud ceiling, wind shear, and wave swell guidance.
- A **citizen** needs simple mobility advice on whether to carry an umbrella or alter commuting times.

WeatherGPT solves this by fusing real-time weather telemetry, domain-specific rule engines, vector-search retrieval-augmented generation (RAG), and Large Language Models (LLMs) to deliver contextualized, natural-language, and multi-lingual weather intelligence.

### 1.3 Key User Journeys
1. **Conversational Weather AI**: Ask location-based weather questions via text or voice and receive multi-modal responses (text + structured Meteorological Command Cards).
2. **Interactive 3D Earth & Regional Maps**: Visualizing live multi-layer GIS feeds (Radar reflectivity, Wind vectors, Temperature, Precipitation, Clouds, Humidity) over India and global coordinates.
3. **Severe Weather & Early Warnings**: District-level real-time bulletin monitoring, filtering by severity (Red/Amber/Yellow) and active phenomena (cyclones, flash floods, squalls).
4. **Agricultural Crop Intelligence**: Crop-specific weather advisories, evapotranspiration guidance, soil moisture monitoring, and irrigation decision support.
5. **Climate Analytics & Research Library**: Long-term precipitation and temperature trend analysis across 15+ years for climate researchers and policy analysts.

### 1.4 Intended User Personas
- **General Citizens**: Daily planning, mobility alerts, basic weather queries.
- **Farmers & Agronomists**: Crop-stage weather risks, irrigation scheduling, fungal spore alerts.
- **Disaster Managers & EOC Officials**: Urban drainage overflow, coastal storm surge, evacuation advisories.
- **Aviation & Marine Operators**: Cloud base, visibility, wind shear, sea swell, port warning signals.
- **Researchers & Meteorologists**: Thermodynamic indices (CAPE, PWAT, Lifted Index), synoptic charts, NWP model comparisons.

---

## 2. CURRENT REPOSITORY ARCHITECTURE

The current repository is a fully functional full-stack application built with Express 5 and React 19.

```
aeris_SIH/
├── data/                       # Local JSON database storage (Current)
│   ├── chats.json              # Persistent user conversation threads
│   └── users.json              # Local user accounts (Bcrypt password hashes)
├── public/                     # Static public assets
├── src/                        # React Frontend Source Code
│   ├── components/             # UI Components
│   │   ├── auth/               # Authentication modals
│   │   │   └── AuthModal.jsx   # Multi-tab auth modal (Login/Signup/Forgot Password OTP)
│   │   ├── chat/               # Conversational UI components
│   │   │   ├── ChatInput.jsx
│   │   │   ├── ImageUploadModal.jsx
│   │   │   ├── PersonaSelector.jsx
│   │   │   ├── SuggestionChips.jsx
│   │   │   ├── VisualAnalysisCard.jsx
│   │   │   ├── VoiceModal.jsx
│   │   │   └── WeatherCard.jsx
│   │   ├── earth/              # 3D Graphics Engine
│   │   │   ├── EarthCanvas.jsx # Three.js interactive 3D Globe
│   │   │   └── textureGenerator.js
│   │   └── layout/             # Application Shell Layout
│   │       ├── AppLayout.jsx
│   │       ├── Header.jsx
│   │       └── Sidebar.jsx
│   ├── context/                # React Context Providers
│   │   ├── AuthContext.jsx     # Auth state, session management, modal triggers
│   │   ├── ChatContext.jsx     # Chat state, message dispatch, backend persistence
│   │   └── PersonaContext.jsx  # Active persona management (default: 'citizen')
│   ├── data/                   # Client-side Mock Datasets
│   │   ├── mockAlerts.js       # Regional warning bulletins
│   │   ├── mockClimate.js      # 15-year historical climate trends
│   │   ├── mockStations.js     # Weather telemetry stations in India
│   │   └── mockWeather.js      # Prompt suggestions & fallback knowledge base
│   ├── pages/                  # Page Views (React Router 7)
│   │   ├── AlertsPage.jsx      # Severe weather bulletins & filter view
│   │   ├── ChatPage.jsx        # Main WeatherGPT interactive chat view
│   │   ├── ClimatePage.jsx     # Climate graphs (Recharts)
│   │   ├── LibraryPage.jsx     # Historical research archive
│   │   ├── MapPage.jsx         # 2D/3D interactive GIS Weather Map
│   │   └── SettingsPage.jsx    # User settings & API diagnostic view
│   ├── services/               # Frontend Integration Services
│   │   ├── aiService.js        # Rule-based fallback response & vision analysis generator
│   │   └── authService.js      # API fetch client for /api/auth/* routes
│   ├── utils/                  # Geolocation & math helpers
│   │   └── geoUtils.js         # Distance math & station matchers
│   ├── App.jsx                 # Main application router & provider wrapper
│   ├── index.css               # Tailwind CSS v4 styling rules & custom themes
│   └── main.jsx                # React DOM root entry point
├── BACKEND_HANDOFF.md          # Legacy handoff documentation
├── index.html                  # HTML entry point
├── package.json                # Project dependencies & npm scripts
├── server.js                   # Node.js Express 5 REST API & SPA static server
└── vite.config.js              # Vite build configuration (@tailwindcss/vite plugin)
```

### 2.1 Existing Subsystems
1. **Unified Server (`server.js`)**: Runs Express 5 on port `5000`. Serves all `/api/*` REST endpoints and serves the compiled React production bundle from `dist/` in production mode.
2. **Authentication Subsystem**:
   - `POST /api/auth/check-email`: Email existence check.
   - `GET /api/auth/matching-emails`: Auto-complete email query.
   - `POST /api/auth/login`: Bcrypt password verification.
   - `POST /api/auth/signup`: Bcrypt (10 salt rounds) user registration.
   - `GET /api/auth/google/url` & `/callback`: Google OAuth 2.0 flow.
   - `POST /api/auth/forgot-password/request-otp`, `/verify-otp`, `/reset-password`: In-memory salted SHA-256 OTP dispatch via Nodemailer SMTP.
   - `GET /api/auth/me`: JWT bearer token validation.
3. **Chat Persistence Subsystem**:
   - `GET /api/chats`: Retrieves chat threads filtered by user email.
   - `POST /api/chats`: Saves or updates conversation history in `data/chats.json` with fallback to `localStorage`.
   - `DELETE /api/chats/:id`: Removes chat thread.
4. **Client-side AI & Weather Simulation (`src/services/aiService.js`)**:
   - Simulates multi-persona advisories, risk breakdown cards, cloud vision analysis, and Web Speech API / WebkitSpeechRecognition voice synthesis.

---

## 3. TARGET ARCHITECTURE

The target architecture transitions AERIS from client-side simulated responses and local JSON file storage to a resilient, enterprise-grade cloud architecture powered by **Express API**, **Supabase PostgreSQL (with pgvector)**, and **OpenRouter AI Orchestration**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           REACT FRONTEND (SPA)                          │
│        (Vite + Tailwind v4 + Three.js Globe + Recharts + Web Audio)     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP REST / SSE / WebSockets
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            EXPRESS API SERVER                           │
│        (Routing, Auth JWT Guard, Input Validation, Rate Limiting)       │
└──────┬──────────────────┬────────────────────┬───────────────────┬──────┘
       │                  │                    │                   │
       ▼                  ▼                    ▼                   ▼
┌──────────────┐   ┌──────────────┐     ┌──────────────┐    ┌──────────────┐
│  SUPABASE    │   │ OPENROUTER   │     │ WEATHER      │    │ AGRICULTURAL │
│ POSTGRESQL   │   │  AI ENGINE   │     │ GEOCODING    │    │ RAG ENGINE   │
│  (Auth/RLS/  │   │ (Claude 3.5 /│     │ PROVIDERS    │    │ (pgvector +  │
│  Realtime)   │   │ GPT-4o / LLaMA│     │ (OpenWeather/│    │ Knowledge    │
│              │   │  DeepSeek)   │     │ IMD / Meteo) │    │  Base)       │
└──────────────┘   └──────────────┘     └──────────────┘    └──────────────┘
```

### 3.1 Subsystem Responsibilities
- **Frontend**: Renders responsive UI, handles state management, processes speech/audio input, displays maps and cards. Communicates **strictly** with the Express API.
- **Backend (Express API)**: Acts as the secure Gateway. Handles route handling, request validation, identity verification, rate limiting, and vendor API orchestration.
- **Database (Supabase PostgreSQL)**: Master persistence engine for User Profiles, Chat History, Weather Caching, Crop KB, and Vector Embeddings (`pgvector`).
- **Weather Service**: Ingests, normalizes, and caches multi-source weather telemetry (OpenWeatherMap, Tomorrow.io, IMD, Open-Meteo).
- **Geocoding Service**: Converts city names, districts, and coordinates into standardized Indian/global location entities.
- **AI Service (OpenRouter Orchestration)**: Assembles prompt contexts (weather + crop profile + user persona + RAG chunks) and executes server-side LLM calls.
- **Agricultural Advisory Engine**: Evaluates weather parameters against deterministic crop vulnerability matrices (evapotranspiration, GDD, fungal risk).
- **RAG Service (pgvector)**: Performs vector similarity search over embedded agricultural and meteorological documents to provide context snippets to the AI engine.
- **Alert Service**: Normalizes, filters, and broadcasts regional meteorological warnings.
- **Realtime Service**: Pushes live weather updates and alert notifications over Supabase Realtime / WebSockets.

---

## 4. TEAM OWNERSHIP

To ensure clear accountability, the project is divided into six logical ownership domains.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                               TEAM OWNERSHIP MATRIX                               │
├────────────────────────────────┬──────────────────────────────────────────────────┤
│ SUBSYSTEM DOMAIN               │ PRIMARY RESPONSIBILITIES                         │
├────────────────────────────────┼──────────────────────────────────────────────────┤
│ A. Supabase / DB / Auth / RLS  │ PostgreSQL schemas, migrations, RLS policies,    │
│                                │ Supabase Auth integration, Realtime channels.    │
├────────────────────────────────┼──────────────────────────────────────────────────┤
│ B. Weather + Geocoding         │ Weather API integration, geocoding search,       │
│                                │ caching layer, normalized weather object factory.│
├────────────────────────────────┼──────────────────────────────────────────────────┤
│ C. OpenRouter + AI Engine      │ OpenRouter client, system prompt templates,      │
│                                │ persona formatting, response parser/validator.   │
├────────────────────────────────┼──────────────────────────────────────────────────┤
│ D. Crop Intelligence + RAG     │ Agricultural schemas, crop rule matrix, pgvector │
│                                │ document embeddings, similarity search pipeline. │
├────────────────────────────────┼──────────────────────────────────────────────────┤
│ E. Alerts + Climate + Maps     │ Severe weather alert feeds, 15-year climate      │
│                                │ datasets, GIS map layers (radar/wind/temp).      │
├────────────────────────────────┼──────────────────────────────────────────────────┤
│ F. Frontend Integration & UX   │ React UI components, page routes, state contexts, │
│                                │ API consumption, error handling & end-to-end QA. │
└────────────────────────────────┴──────────────────────────────────────────────────┘
```

### 4.1 Collaboration & Governance Rules
1. **Branch-Based Work**: All development occurs in dedicated feature branches. Direct commits to `main` are strictly forbidden.
2. **Review Requirement**: Any change affecting a shared contract (API schemas, database tables, environment variables) requires review by affected owners.
3. **No Silent Redesigns**: No member shall rewrite or alter another member's subsystem without prior alignment.

---

## 5. BRANCHING AND GIT RULES

### 5.1 Branch Naming Conventions
- `feature/supabase` — Supabase integration, DB migrations, Auth RLS.
- `feature/weather` — Weather API integrations, geocoding, caching.
- `feature/openrouter` — OpenRouter SDK integration, prompt management.
- `feature/crops-rag` — Crop profile schemas, pgvector pipeline, RAG queries.
- `feature/alerts-climate` — Alerts normalization, climate trend API, GIS map feeds.
- `feature/frontend-integration` — Frontend API hooks, UI binding, error handling.

### 5.2 Git Workflow Rules
1. **Branch from `main`**: Always sync `main` before branching (`git checkout main && git pull origin main`).
2. **Commit Small & Clean**: Write clear, descriptive commit messages.
3. **Pre-PR Sync**: Merge or rebase the latest `main` into your feature branch before opening a Pull Request (PR).
4. **Pre-PR Verification**: Run `npm run build` locally to verify zero build errors.
5. **Pull Requests (PRs)**: All code must enter `main` via PRs with at least 1 peer review.
6. **Main Safety**: `main` must remain 100% buildable and runnable at all times.

---

## 6. FOLDER / MODULE CONVENTIONS

### 6.1 Backend Folder Organization (Target Structure)
To keep the application modular without breaking existing `server.js` startup during transition, new backend logic shall be organized under the `server/` directory:

```
server/
├── config/             # Environment variables loader & Supabase/OpenRouter clients
├── middleware/         # Express middlewares (authGuard, validateRequest, rateLimiter)
├── routes/             # Express route handlers
│   ├── alerts.js       # GET /api/alerts
│   ├── auth.js         # /api/auth/* routes
│   ├── chat.js         # POST /api/chat & /api/chats
│   ├── climate.js      # GET /api/climate/:location
│   ├── crops.js        # GET /api/crops & /api/crops/:crop
│   ├── location.js     # GET /api/locations/search
│   └── weather.js      # GET /api/weather/:location
├── services/           # Core domain logic & third-party integrations
│   ├── alertService.js
│   ├── cropService.js
│   ├── geocodingService.js
│   ├── openRouterService.js
│   ├── ragService.js
│   └── weatherService.js
└── utils/              # Shared backend helpers (logger, error Formatter, math)
```

### 6.2 Frontend Folder Organization
Maintain current `src/` directory conventions:
- `src/components/` — Modular React UI components grouped by feature area (`auth`, `chat`, `earth`, `layout`).
- `src/context/` — State providers (`AuthContext`, `ChatContext`, `PersonaContext`).
- `src/pages/` — Top-level views corresponding to application routes.
- `src/services/` — Client-side API fetch abstraction modules.
- `src/utils/` — Client utility helpers.

---

## 7. API CONTRACT

All public backend endpoints MUST conform to the exact contracts specified below.

### 7.1 `POST /api/chat`
- **Owner**: Subsystem C (AI Engine) & Subsystem F (Frontend)
- **Auth**: Optional (Guest allowed, User authenticated via Bearer token)
- **Request Body**:
  ```json
  {
    "message": "Will it rain in Ahmedabad tomorrow afternoon?",
    "conversationId": "chat_1725321600_a8f9d",
    "persona": "farmer",
    "location": {
      "name": "Ahmedabad",
      "latitude": 23.0225,
      "longitude": 72.5714
    }
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "conversationId": "chat_1725321600_a8f9d",
    "response": {
      "text": "Moderate to heavy convective rainfall (28–42 mm) is expected in Ahmedabad tomorrow between 16:00 and 20:30 IST. Relative humidity will peak at 84%.",
      "card": {
        "type": "METEOROLOGICAL_COMMAND_CARD",
        "location": "Ahmedabad, Gujarat",
        "tempRange": "24°C — 31°C",
        "currentTemp": "29.4°C",
        "rainProb": 78,
        "windSpeed": "18 km/h WSW",
        "humidity": "82%",
        "riskLevel": "MODERATE",
        "riskColor": "#f59e0b",
        "personaAdvisory": {
          "title": "AGRONOMIC FIELD DIRECTIVE",
          "recommendation": "HOLD scheduled drip and canal irrigation. Natural precipitation of 28–42 mm expected will saturate root zones.",
          "metrics": [
            { "label": "Root Zone Moisture", "val": "34% (Optimal)" },
            { "label": "Water Saved", "val": "42,000 L / Ha" }
          ]
        },
        "whyThisRisk": {
          "factors": [
            { "title": "78% Precipitation Prob", "detail": "Ensemble agreement across NWP models." }
          ]
        },
        "source": "AERIS Multi-Provider Ensemble",
        "updated": "2026-09-03T01:30:00Z"
      },
      "sources": ["IMD Radar", "OpenWeatherMap", "AERIS Agro Matrix"]
    }
  }
  ```

### 7.2 `GET /api/weather/:location`
- **Owner**: Subsystem B (Weather)
- **Auth**: None (Public)
- **Query Params**: `lat` (optional), `lon` (optional)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "location": {
        "name": "Ahmedabad",
        "district": "Ahmedabad",
        "state": "Gujarat",
        "country": "India",
        "latitude": 23.0225,
        "longitude": 72.5714
      },
      "current": {
        "temp": 29.4,
        "feelsLike": 33.1,
        "humidity": 82,
        "pressure": 1008,
        "windSpeed": 18,
        "windDirection": "WSW",
        "precipitation": 2.4,
        "precipitationProbability": 78,
        "condition": "Thunderstorm",
        "visibility": 6.0,
        "uvIndex": 6,
        "sunrise": "06:15 IST",
        "sunset": "19:02 IST"
      },
      "hourly": [
        { "time": "14:00", "temp": 30.1, "rainProb": 35, "condition": "Partly Cloudy" },
        { "time": "16:00", "temp": 28.5, "rainProb": 78, "condition": "Heavy Rain" }
      ],
      "daily": [
        { "date": "2026-09-03", "tempMin": 24.0, "tempMax": 31.0, "rainProb": 78, "condition": "Thunderstorm" }
      ],
      "source": "OpenWeatherMap + IMD Telemetry",
      "retrievedAt": "2026-09-03T01:30:00Z"
    }
  }
  ```

### 7.3 `GET /api/alerts`
- **Owner**: Subsystem E (Alerts)
- **Auth**: None (Public)
- **Query Params**: `state` (optional), `severity` (optional)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "alerts": [
      {
        "id": "alert_guj_2026_0912",
        "title": "Heavy Rain & Squally Wind Advisory",
        "severity": "Severe",
        "severityLevel": "RED",
        "state": "Gujarat",
        "affectedDistricts": ["Ahmedabad", "Gandhinagar", "Kheda"],
        "phenomenon": "Thunderstorm & Squall",
        "windSpeed": "58 - 72 km/h",
        "validUntil": "2026-09-04T22:00:00Z",
        "instruction": "Farmers should clear drainage outlets. Fishermen advised to refrain from entering Gulf of Khambhat.",
        "issuedBy": "India Meteorological Department (IMD)"
      }
    ]
  }
  ```

### 7.4 `GET /api/crops` & `GET /api/crops/:crop`
- **Owner**: Subsystem D (Crop Intelligence)
- **Auth**: None (Public)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "crop": {
      "id": "cotton",
      "cropName": "Cotton",
      "season": "Kharif",
      "optimalTempRange": { "min": 21, "max": 35 },
      "rainfallRequirement": "500 - 1000 mm",
      "criticalStages": ["Square formation", "Flowering", "Boll development"],
      "weatherRisks": ["Waterlogging during boll opening", "High humidity encouraging pink bollworm"],
      "irrigationGuidance": "Maintain soil moisture at 60-70% field capacity during flowering."
    }
  }
  ```

### 7.5 `GET /api/locations/search`
- **Owner**: Subsystem B (Geocoding)
- **Auth**: None (Public)
- **Query Params**: `q=Ahmedabad`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "results": [
      {
        "name": "Ahmedabad",
        "district": "Ahmedabad",
        "state": "Gujarat",
        "country": "India",
        "latitude": 23.0225,
        "longitude": 72.5714
      }
    ]
  }
  ```

### 7.6 `GET /api/climate/:location`
- **Owner**: Subsystem E (Climate)
- **Auth**: None (Public)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "location": "Ahmedabad, Gujarat",
    "trends": [
      { "year": 2010, "avgTemp": 27.2, "annualRainfall": 740 },
      { "year": 2025, "avgTemp": 28.1, "annualRainfall": 890 }
    ]
  }
  ```

---

## 8. STANDARD ERROR FORMAT

All backend API error responses MUST strictly adhere to this structure:

```json
{
  "error": {
    "code": "WEATHER_PROVIDER_ERROR",
    "message": "Unable to retrieve weather telemetry from primary provider.",
    "details": null
  }
}
```

### Standard HTTP Status Usage
- `200 OK`: Request succeeded.
- `201 Created`: Resource created successfully.
- `400 Bad Request`: Validation failure or invalid parameters.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Authenticated user lacks permission.
- `404 Not Found`: Requested endpoint or resource does not exist.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Server-side unhandled exception.
- `502 Bad Gateway`: Third-party provider (Weather API / OpenRouter) error.
- `503 Service Unavailable`: Upstream service or DB connection unavailable.

---

## 9. CHAT CONTRACT

The contract between Frontend, Backend, and AI Service for conversational interactions MUST maintain stable field names regardless of the underlying LLM provider.

### 9.1 Normalized Chat Response Schema
```json
{
  "message": "User query text",
  "conversationId": "chat_xyz",
  "persona": "citizen | farmer | disaster | aviation | marine | researcher",
  "location": {
    "name": "Ahmedabad",
    "latitude": 23.0225,
    "longitude": 72.5714
  },
  "intent": "FORECAST | IRRIGATION | ALERT | CYCLONE | CLIMATE",
  "weather": { ... },
  "crop": { ... },
  "advisory": {
    "title": "ADVISORY HEADER",
    "recommendation": "Detailed actionable steps",
    "metrics": [ { "label": "Key", "val": "Value" } ]
  },
  "alerts": [ ... ],
  "sources": [ "IMD", "OpenWeatherMap", "AERIS RAG" ]
}
```

*Frontend components must depend ONLY on this schema, never on vendor-specific raw payloads.*

---

## 10. WEATHER DATA CONTRACT

All weather service integrations (OpenWeatherMap, Tomorrow.io, IMD API, Open-Meteo) must transform external vendor data into this standard internal `WeatherData` format before returning data to the core API:

```json
{
  "location": {
    "name": "String",
    "district": "String",
    "state": "String",
    "country": "String",
    "latitude": "Number",
    "longitude": "Number"
  },
  "current": {
    "temp": "Number (°C)",
    "feelsLike": "Number (°C)",
    "humidity": "Number (%)",
    "pressure": "Number (hPa)",
    "windSpeed": "Number (km/h)",
    "windDirection": "String (Cardinal/Degrees)",
    "precipitation": "Number (mm)",
    "precipitationProbability": "Number (%)",
    "condition": "String",
    "visibility": "Number (km)",
    "uvIndex": "Number",
    "sunrise": "String (HH:MM IST)",
    "sunset": "String (HH:MM IST)"
  },
  "hourly": [
    {
      "time": "String (HH:MM)",
      "temp": "Number (°C)",
      "rainProb": "Number (%)",
      "condition": "String"
    }
  ],
  "daily": [
    {
      "date": "String (YYYY-MM-DD)",
      "tempMin": "Number (°C)",
      "tempMax": "Number (°C)",
      "rainProb": "Number (%)",
      "condition": "String"
    }
  ],
  "source": "String",
  "retrievedAt": "String (ISO 8601 Timestamp)"
}
```

---

## 11. LOCATION / GEOCODING CONTRACT

The geocoding service resolves raw queries into a normalized `LocationData` shape:

```json
{
  "name": "Ahmedabad",
  "district": "Ahmedabad",
  "state": "Gujarat",
  "country": "India",
  "latitude": 23.0225,
  "longitude": 72.5714
}
```

*The frontend application MUST NOT maintain hardcoded city lists. All location search queries must resolve dynamically through `/api/locations/search`.*

---

## 12. CROP / AGRICULTURE CONTRACT

The crop intelligence module uses structured knowledge profiles + deterministic agronomic rules + RAG + LLM explanations.

```json
{
  "id": "groundnut",
  "cropName": "Groundnut",
  "season": "Kharif",
  "optimalTempRange": { "min": 22, "max": 32 },
  "rainfallRequirement": "500 - 700 mm",
  "humidityLimit": 80,
  "growthStages": ["Germination", "Pegging", "Pod formation", "Maturity"],
  "irrigationGuidance": "Critical water requirement during pegging and pod development stages.",
  "weatherRisks": ["Waterlogging leading to pod rot", "Dry spell during pegging stage"],
  "diseaseRelationships": [
    { "disease": "Tikka leaf spot", "triggerCondition": "Temp 25-30°C and Relative Humidity > 85% for 2 consecutive days" }
  ],
  "advisoryRules": [
    { "condition": "precipitation_24h > 30mm", "action": "Hold irrigation for next 48 hours" }
  ]
}
```

> **Design Principle**: Do NOT train custom LLMs for each crop. Combine structured rules with RAG retrieval and use the LLM solely for natural language synthesis.

---

## 13. RAG / PGVECTOR ARCHITECTURE

```
┌────────────────────────┐      ┌────────────────────────┐
│  Agricultural PDF/Doc  │ ───► │ Embedding (OpenAI /    │ ───► Supabase pgvector
│  & Weather KB Archive  │      │  bge-large-en)         │      knowledge_chunks
└────────────────────────┘      └────────────────────────┘
                                                                    │
┌────────────────────────┐      ┌────────────────────────┐          │ Cosine Similarity
│  User Query + Weather  │ ───► │ Query Vector Embedding │ ─────────┼──► Top-K Context Snippets
└────────────────────────┘      └────────────────────────┘          │
                                                                    ▼
                                                        ┌────────────────────────┐
                                                        │ OpenRouter LLM Prompt  │
                                                        └────────────────────────┘
```

1. **Document Ingestion**: Agricultural advisories, ICAR guidelines, and regional weather manuals are chunked (~500 tokens) and converted into 1536-dimensional vector embeddings.
2. **Vector Storage**: Embeddings are stored in Supabase PostgreSQL using the `pgvector` extension in table `knowledge_chunks`.
3. **Retrieval Pipeline**: On a user query, Subsystem D computes the query vector, executes `<=>` cosine distance search, and retrieves top 3-5 relevant snippets.
4. **Prompt Injection**: Retrived context is injected into the OpenRouter system prompt.
5. **Factual Grounding**: The system prompt strictly prohibits the LLM from hallucinating current weather telemetry — exact measurements must come directly from the normalized `WeatherData` payload.

---

## 14. OPENROUTER ARCHITECTURE

OpenRouter serves as the unified LLM provider abstraction, enabling seamless model switching (e.g., Anthropic Claude 3.5 Sonnet, OpenAI GPT-4o, DeepSeek R1, Meta LLaMA 3.3).

```
Client ──► Express API ──► Collect Telemetry & RAG ──► OpenRouter API ──► Client Schema
```

### Security Requirement
`OPENROUTER_API_KEY` is a **server-only secret**. It MUST NEVER be exposed in client code or `VITE_` variables.

---

## 15. SUPABASE ARCHITECTURE

Supabase PostgreSQL is the central relational and vector storage platform.

### 15.1 Planned Tables & Schemas

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- User Profiles (Extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Citizen',
  avatar_color TEXT DEFAULT 'from-emerald-500 to-teal-600',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Sessions
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  persona TEXT DEFAULT 'citizen',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  text TEXT NOT NULL,
  card_data JSONB,
  sources JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weather Cache
CREATE TABLE weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name TEXT NOT NULL,
  latitude NUMERIC(8,5) NOT NULL,
  longitude NUMERIC(8,5) NOT NULL,
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Vector Embeddings for RAG
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 15.2 Row Level Security (RLS)
- `profiles`: Users can read/update only their own record (`auth.uid() = id`).
- `chat_sessions` & `chat_messages`: Users can read/write only their own chats (`auth.uid() = user_id`).
- `weather_cache`, `crop_profiles`, `alerts`, `knowledge_chunks`: Read-only for authenticated and public users; write access restricted to backend service role.

---

## 16. SECURITY RULES

1. **Never Commit Secrets**: Secrets (`.env`) must never be committed to Git repositories.
2. **Strict Variable Isolation**: Server secrets (`OPENROUTER_API_KEY`, `SUPABASE_SECRET_KEY`, `SESSION_SECRET`, `SMTP_PASS`) must NEVER be prefixed with `VITE_`.
3. **No Direct Third-Party API Calls from Browser**: The browser frontend must never hold direct OpenRouter or private Weather API credentials.
4. **Server-Side Token Verification**: All authenticated API requests must validate identity on the server (`req.headers.authorization`).
5. **Authorization via Authenticated Identity**: Never rely on user-submitted `user_id` query parameters for data access control — rely strictly on the authenticated session (`auth.uid()`).
6. **Input Validation**: Validate all incoming parameters (coordinates, text queries, JSON payloads) before processing.
7. **Sanitize Data**: Strip internal infrastructure details and credential strings from public error messages.
8. **Use Publishable Client Keys**: Frontends must only use Supabase `VITE_SUPABASE_PUBLISHABLE_KEY`.

---

## 17. ENVIRONMENT VARIABLES

### 17.1 Canonical Variable Definitions

```env
# =========================================================================
# FRONTEND VARIABLES (Publicly exposed in browser bundle via VITE_)
# =========================================================================
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key

# =========================================================================
# BACKEND VARIABLES (STRICTLY PRIVATE SERVER-ONLY SECRETS)
# =========================================================================
PORT=5000
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your_secure_session_secret_key

# Database & Supabase Privileged Service Role
DATABASE_URL=data/users.json
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_service_role_secret_key

# AI Orchestration Secret
OPENROUTER_API_KEY=your_openrouter_api_key_sk_or_v1

# Weather & Geocoding Secrets
WEATHER_API_KEY=your_openweather_or_tomorrow_api_key

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Transactional Email / SMTP Credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM="AERIS Intelligence" <no-reply@aeris.ai>
```

---

## 18. SHARED TYPES / CONTRACTS

Because this codebase is written in modern JavaScript (ES Modules), formal shared schema definitions shall be maintained in a central schema utility module (`server/utils/schemas.js` or `src/utils/schemas.js`) with JSDoc typing to enforce shape consistency across frontend and backend.

### Core Shared Types
- `WeatherData`: Standardized weather metrics object.
- `LocationData`: Standardized geocoded geographic location.
- `ChatResponse`: Standardized WeatherGPT AI response object.
- `CropProfile`: Agricultural crop specification object.
- `Alert`: Standardized meteorological severe weather bulletin.
- `ApiError`: Standardized API error payload.

---

## 19. INTEGRATION RULES

1. **Provider Abstraction**: All external providers (Weather, Geocoding, LLMs) MUST be hidden behind service boundary modules (`weatherService.js`, `openRouterService.js`).
2. **Stable API Boundaries**: Changes to provider implementations must NOT alter the public REST endpoint schemas.
3. **No Direct Provider Access**: The React frontend talks strictly to the application's Express API (`/api/*`), never directly to third-party APIs.
4. **Provider Switching Safety**: Swapping OpenRouter models or weather data providers must be achievable by changing backend configuration without triggering frontend code edits.

---

## 20. TESTING / ACCEPTANCE CHECKLIST

Before opening a Pull Request for a feature branch, the following verification checklist MUST be executed.

### 20.1 Feature Branch Pre-PR Checklist
- [ ] `npm install` installs cleanly with no missing packages.
- [ ] `npm run build` succeeds with zero errors.
- [ ] Node server boots successfully with `node server.js`.
- [ ] All new API endpoints return the standard error format on failure.
- [ ] Server secrets are confirmed absent from all frontend build outputs.
- [ ] No `console.error` unhandled promise rejections on page render.
- [ ] Existing pages (`/chat`, `/map`, `/alerts`, `/climate`, `/library`, `/settings`) render correctly.

### 20.2 Final Hackathon Integration Checklist
- [ ] User Signup, Login, and Session restore (`/api/auth/me`) work end-to-end.
- [ ] WeatherGPT Chat produces persona-specific responses and command cards.
- [ ] Interactive 3D Earth Globe and 2D GIS Weather Map render smoothly.
- [ ] Alerts dashboard correctly displays and filters active warning bulletins.
- [ ] Climate graphs render historical metrics without errors.
- [ ] Production build (`npm run build`) generates valid static bundle in `dist/`.

---

## 21. MERGE ORDER / DEPENDENCIES

To prevent integration bottlenecks, team members should follow this dependency-aware merge sequence:

```
Step 1: Supabase DB & Auth Foundation (Owner A)
   │
   ├──────► Step 2: Weather & Geocoding Service (Owner B)    ┐
   │                                                         │
   ├──────► Step 3: OpenRouter AI Engine (Owner C)           ├─► Parallel Execution
   │                                                         │   (Using Mock APIs)
   ├──────► Step 4: Crop KB & pgvector RAG (Owner D)         │
   │                                                         │
   └──────► Step 5: Alerts & Climate Data (Owner E)          ┘
   │
   ▼
Step 6: Frontend Integration & End-to-End QA (Owner F)
```

---

## 22. CHANGE CONTROL

Any modification involving the following items MUST be discussed and agreed upon by affected subsystem owners prior to merging:

1. Changing public API endpoint routes or JSON request/response shapes.
2. Altering Supabase PostgreSQL database schemas or RLS policies.
3. Modifying environment variable names.
4. Changing authentication token mechanics or header requirements.
5. Replacing core project dependencies (Express, React, Vite, Three.js, Tailwind).

---

## 23. CURRENT VS FUTURE STATUS

| Capability | Current Status | Target Status | Subsystem Owner |
| :--- | :--- | :--- | :--- |
| **Authentication** | Local JSON (`users.json`) + JWT + Google OAuth | Supabase Auth + RLS + JWT | **Owner A** |
| **Chat Persistence** | Local JSON (`chats.json`) + `localStorage` | Supabase PostgreSQL `chat_sessions` | **Owner A** |
| **Weather Telemetry** | Simulated rule engine (`mockWeather.js`) | OpenWeatherMap / Tomorrow.io / IMD API | **Owner B** |
| **Geocoding** | Mock distance calculation (`geoUtils.js`) | Real Geocoding API (OpenStreetMap / Nominatim) | **Owner B** |
| **OpenRouter AI** | Client-side simulation (`aiService.js`) | Server-side OpenRouter API Orchestration | **Owner C** |
| **Crop Intelligence** | Hardcoded advisories in mock cards | Structured Crop Engine + Agronomic Rules | **Owner D** |
| **RAG System** | Simulated knowledge lookup | Supabase `pgvector` Document Retrieval | **Owner D** |
| **Realtime Updates** | Static polling simulation | Supabase Realtime WebSocket Channels | **Owner A** |
| **Alerts Engine** | Static bulletins (`mockAlerts.js`) | Live IMD / Global Alert Feed Integration | **Owner E** |
| **Climate Trends** | Static dataset (`mockClimate.js`) | Historical Reanalysis Dataset APIs | **Owner E** |
| **GIS Weather Maps** | Canvas / Three.js mock layer rendering | Tile server / OpenWeather GIS layer feeds | **Owner E** |
| **Voice & Speech** | Web Speech API client synthesis | Web Speech API + Whisper Server Transcribe | **Owner F** |
| **Multilingual Support**| English UI with mock translation | OpenRouter multi-lingual prompt translation | **Owner C** |

---

## 24. HACKATHON PRIORITIES

> **GOLDEN RULE FOR HACKATHON SUCCESS**:  
> *Reliability, clean user experience, and seamless subsystem integration are 10x more valuable than adding complex, unverified infrastructure.*

- **DO NOT** attempt to deploy raw WRF/GFS atmospheric modeling pipelines or Kubernetes clusters.
- **DO NOT** introduce unnecessary microservices or Kafka message buses.
- **DO** focus on rock-solid API contracts, fast response times, beautiful visuals, and reliable AI advisories.

---

## 25. IMPORTANT DEVELOPMENT RULE

> **BEFORE IMPLEMENTING A FEATURE THAT TOUCHES ANOTHER SUBSYSTEM, READ ARCHITECTURE.MD AND PRESERVE THE DOCUMENTED CONTRACTS.**  
> **DO NOT SILENTLY CHANGE SHARED CONTRACTS TO MAKE A LOCAL IMPLEMENTATION EASIER.**
