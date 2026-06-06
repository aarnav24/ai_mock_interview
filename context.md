# AI Mock Interview — Project Context

## Overview

Full-stack AI-powered mock interview platform. Users can practice Technical or HR interviews with an AI interviewer that speaks questions aloud, listens to voice answers, evaluates responses, and produces a scored report.

**Monorepo structure:**
```
ai_mock_interview/
├── client/   (React + Vite frontend)
└── server/   (Express backend)
```

---

## Tech Stack

### Frontend (`client/`)
| Layer | Tech |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router DOM v7 |
| State | Redux Toolkit + React Redux |
| Styling | Tailwind CSS v4 |
| Animation | Motion (Framer Motion) |
| Auth | Firebase (Google OAuth) |
| HTTP | Axios |
| Charts | Recharts (AreaChart) |
| Progress UI | react-circular-progressbar |
| PDF export | jsPDF + jspdf-autotable |
| Icons | react-icons |

### Backend (`server/`)
| Layer | Tech |
|---|---|
| Runtime | Node.js (ESM modules) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT (jsonwebtoken, 7d expiry) |
| Session | Cookie-based (`token` cookie, httpOnly) |
| AI | OpenRouter API (`openai/gpt-oss-120b:free` model) |
| PDF parsing | pdfjs-dist (legacy build) |
| File upload | Multer |
| WebSocket | express-ws (installed, not active) |
| Deepgram SDK | Installed but routes commented out |

---

## Environment Variables

### `server/.env`
```
PORT=8000
MONGODB_URL=<mongo connection string>
JWT_SECRET=<secret>
OPENROUTER_API_KEY=<key>
```

### `client/.env`
```
VITE_FIREBASE_API_KEY=<key>
```

Firebase project: `interview-agent-6b9cc`

---

## Architecture

```
Client (localhost:5173)
  ↕ REST (Axios + credentials/cookies)
Server (localhost:8000)
  ↕ Mongoose
MongoDB Atlas
  ↕ OpenRouter API
  openai/gpt-oss-120b:free
```

CORS: server allows only `http://localhost:5173` with credentials.

---

## Backend

### Entry: `server/index.js`
- Express app with `express-ws` attached
- Routes: `/api/auth`, `/api/user`, `/api/interview`
- Deepgram route commented out

### Auth Middleware: `server/middlewares/auth.middleware.js`
- Reads JWT from `req.cookies.token`
- Verifies with `JWT_SECRET`, attaches `req.userId`

### Multer: `server/middlewares/multer.js`
- Single file upload for PDF resumes

### AI Service: `server/services/openRouter.service.js`
- `askAI({ messages })` — POSTs to OpenRouter chat completions
- Model: `openai/gpt-oss-120b:free`
- Returns `choices[0].message.content`

---

## Data Models

### User (`server/models/user.model.js`)
```js
{
  name: String (required),
  email: String (unique, required),
  credits: Number (default: 100),
  timestamps: true
}
```

### Interview (`server/models/interview.model.js`)
```js
{
  userId: ObjectId → User,
  role: String,
  experience: String,
  mode: "Technical" | "HR",
  resumeText: String,
  questions: [questionSchema],
  finalScore: Number (default: 0),
  status: "Incomplete" | "Completed",
  timestamps: true
}

questionSchema: {
  question: String,
  difficulty: String,
  timeLimit: Number,
  answer: String,
  feedback: String,
  score: Number (0-10),
  confidence: Number (0-10),
  communication: Number (0-10),
  correctness: Number (0-10)
}
```

---

## API Routes

### Auth: `/api/auth`
| Method | Path | Handler | Description |
|---|---|---|---|
| POST | `/google` | `googleAuth` | Find/create user from Google OAuth, set JWT cookie |
| GET | `/logout` | `logOut` | Clear token cookie |

### User: `/api/user`
| Method | Path | Auth | Handler | Description |
|---|---|---|---|---|
| GET | `/current-user` | ✓ | `getCurrentUser` | Returns full user document |

### Interview: `/api/interview`
| Method | Path | Auth | Handler | Description |
|---|---|---|---|---|
| POST | `/resume` | ✓ | `analyzeResume` | Upload PDF, extract text via pdfjs, call AI to get role/experience/projects/skills JSON |
| POST | `/generate-questions` | ✓ | `generateQuestions` | Generate 5 questions, deduct 50 credits, create Interview doc |
| POST | `/submit-answer` | ✓ | `submitAnswer` | AI evaluates answer → confidence/communication/correctness/score/feedback |
| POST | `/finish` | ✓ | `finishInterview` | Avg all question scores, mark interview Completed, return aggregated scores |
| GET | `/get-interviews` | ✓ | `getMyInterviews` | List all interviews (summary fields only), sorted newest first |
| GET | `/report/:id` | ✓ | `getInterviewReport` | Full interview report with per-question scores + feedback |

---

## Credit System
- New users start with **100 credits**
- Each interview costs **50 credits** (deducted at `generate-questions`)
- Minimum 50 credits required to start an interview
- Credits stored on the User document

---

## Frontend Routes

| Path | Component | Description |
|---|---|---|
| `/` | `Home` | Landing page with features, CTA |
| `/auth` | `Auth` | Google sign-in page |
| `/interview` | `InterviewPage` | 3-step interview flow |
| `/history` | `InterviewHistory` | Past interviews list |
| `/pricing` | `Pricing` | Pricing/credits page |
| `/report/:id` | `InterviewReport` | Persistent report by interview ID |

**Server URL constant:** `export const ServerUrl = "http://localhost:8000"` in `client/src/App.jsx`

---

## Redux State

**Store:** `client/src/redux/store.js`

**Slice:** `userSlice` — single state field `userData` (null or user object from `/api/user/current-user`)

App bootstraps by calling `/api/user/current-user` on mount and dispatching `setUserData`.

---

## Firebase Auth

`client/src/utils/firebase.js`:
- Firebase app: `interview-agent-6b9cc`
- Exports `auth` (getAuth) and `provider` (GoogleAuthProvider)
- Frontend triggers Google popup → gets name+email → POSTs to `/api/auth/google` → receives JWT cookie

---

## Interview Flow (3-Step)

### Step 1 — Setup (`Step1SetUp.jsx`)
1. User enters role, experience, selects mode (Technical/HR)
2. Optionally uploads PDF resume → `POST /api/interview/resume` → AI extracts role, experience, projects, skills
3. Click "Start Interview" → `POST /api/interview/generate-questions` → receives `interviewId`, 5 questions with difficulty + timeLimit
4. 50 credits deducted

### Step 2 — Interview (`Step2Interview.jsx`)
- AI avatar: female/male video (`client/src/assets/Videos/`)
- Voice selection: prefers "zira"/"samantha"/"female" → falls back to "david"/"mark"/"male"
- TTS: Web Speech API (`SpeechSynthesisUtterance`), rate=0.92, pitch=1.05
- STT: `webkitSpeechRecognition`, continuous, en-US
- Flow per question:
  1. AI speaks intro (first question only)
  2. AI speaks question via TTS, video plays
  3. Timer counts down (90s/90s/120s/120s/150s for Q1–Q5)
  4. User answers via mic (toggle) or textarea
  5. Submit → `POST /api/interview/submit-answer` → AI feedback spoken back
  6. "Next Question" → repeat; last question → `POST /api/interview/finish`
- Auto-submit when timer hits 0

### Step 3 — Report (`Step3Report.jsx`)
- Shows: overall score (CircularProgressbar), skill bars (confidence/communication/correctness), area chart (score per question), per-question breakdown with AI feedback
- Download PDF button (jsPDF + autoTable)
- Performance text: ≥8 "Ready for job", ≥5 "Needs minor improvement", <5 "Significant improvement"

**`InterviewReport` page** (`/report/:id`): fetches report from server, renders same `Step3Report` component (persistent, shareable by ID).

---

## Question Generation Prompts

### Technical Mode
- 5 questions, difficulty Easy→Easy→Medium→Medium→Hard
- 3 questions reference candidate's projects/internships
- 2 questions test skills via practical scenarios
- Q5: deeper reasoning, tradeoffs, architecture
- Time limits: 90/90/120/120/150 seconds

### HR Mode
- 5 questions, same difficulty progression
- Distribution: 2 communication/teamwork, 1 challenges/failure, 1 motivation/goals, 1 project/achievement
- Q5: self-reflection, leadership, career planning
- Avoids generic questions ("tell me about yourself", etc.)

---

## Answer Evaluation Scoring

AI scores each answer on 3 dimensions (0–10):
- **Confidence & Clarity**: structured, clear, well-worded
- **Communication**: simple, clear language
- **Correctness & Completeness**: factually accurate, sufficient depth

`finalScore = avg(confidence, communication, correctness)` rounded to nearest integer.

Feedback: 10–15 words, natural human tone.

---

## Key Files Reference

```
server/
  index.js                          — app entry, route registration
  config/connectDB.js               — mongoose connect
  config/token.js                   — JWT sign (7d)
  middlewares/auth.middleware.js    — JWT verify, attach req.userId
  middlewares/multer.js             — file upload config
  models/user.model.js              — User schema
  models/interview.model.js         — Interview + Question schemas
  controllers/auth.controller.js    — googleAuth, logOut
  controllers/user.controller.js    — getCurrentUser
  controllers/interview.controller.js — all interview logic
  services/openRouter.service.js    — askAI() wrapper

client/src/
  App.jsx                           — router, ServerUrl const, boot fetch
  redux/store.js                    — redux store
  redux/userSlice.js                — userData state
  utils/firebase.js                 — firebase init + Google provider
  pages/Home.jsx                    — landing page
  pages/Auth.jsx                    — login page
  pages/InterviewPage.jsx           — 3-step state machine
  pages/InterviewHistory.jsx        — past interviews
  pages/Pricing.jsx                 — pricing page
  pages/InterviewReport.jsx         — persistent report page (/report/:id)
  components/Step1SetUp.jsx         — interview setup form
  components/Step2Interview.jsx     — live interview (TTS/STT/video/timer)
  components/Step3Report.jsx        — analytics report + PDF download
  components/Navbar.jsx             — top nav
  components/Footer.jsx             — footer
  components/AuthModel.jsx          — auth modal (triggered from Home)
  components/timer.jsx              — countdown timer component
```

---

## Known / Noted Issues

- `server/controllers/auth.controller.js`: cookie sets `http: true` (should be `httpOnly: true`) — typo, cookie not actually httpOnly
- Deepgram SDK installed (`@deepgram/sdk`) and route file exists but entire integration is commented out — unused
- `express-ws` attached to app but no WebSocket routes defined
- `ServerUrl` hardcoded to `http://localhost:8000` — needs env var for production

---

## Dev Commands

```bash
# Server
cd server && npm run dev    # nodemon on port 8000

# Client
cd client && npm run dev    # Vite on port 5173
```