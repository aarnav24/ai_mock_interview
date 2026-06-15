# IntervuAI — Full-Stack AI-Powered Interview Prep Platform

An advanced, full-stack AI-powered mock interview platform designed to help users prepare for technical and HR interviews. The platform provides an interactive experience where an AI interviewer speaks questions, listens to voice answers, evaluates responses across multiple dimensions, and generates detailed, downloadable performance reports.

---

## 🚀 Key Features

- 🎙️ **Interactive AI Interviewer**: Live voice interaction powered by Deepgram via WebSocket connection.
- 📻 **Real-time Live Audio Streaming**: Optional high-fidelity live transcription capabilities via integrated Deepgram WebSocket connections.
- 📄 **Dual-DB Resume Archiver**: Upload PDF resumes to extract role, experience level, key projects, and skills. Resumes are stored in a compressed format in a dedicated database (`RESUME_MONGODB_URL`), separate from user metadata.
- ⚙️ **Custom Interview Setup**: Choose between **Technical** and **HR** modes with a structured difficulty progression (Easy → Medium → Hard) and custom question-selection algorithms.
- 🔄 **Drafts & Resume-Session Support**: Safely stores interview state to allow candidates to resume incomplete interviews at any time, backed by `draftStorage` utilities.
- 🤖 **Context-Aware Questioning**: AI dynamically tailors questions based on the candidate's resume, specific projects, and selected focus area.
- 📊 **Detailed Evaluation & Scoring**: Each answer is evaluated by a 120-billion parameter LLM across three core pillars:
  - *Confidence & Clarity*
  - *Communication*
  - *Correctness & Completeness*
- 📈 **Performance Analytics**: Visualized performance graphs (scores per question, skill breakdown charts) showing the average scores of all answers in that session, along with persistent, shareable report links.
- 💳 **Credit-Based System**: Integrated credit validation (e.g., 50 credits per interview session) to manage API resources.
- 💳 **Payment Integration**: Buy credit packages seamlessly with integrated Razorpay order generation and cryptographic payment signature verification.
- 🖨️ **Sanitized PDF Report Export**: Professional PDF report generation using `jsPDF` that automatically sanitizes smart quotes and em-dashes to avoid font encoding errors. The resulting PDF filename is custom-tailored using the candidate's name and target role (e.g., `IntervuAI_Report_CandidateName_Role.pdf`).
- 📁 **Modular UI Structure**: Uses custom Tailwind-based component architecture structured under `/components/ui/` with path aliasing (`@/`).

---

## 🛠️ Tech Stack

### Frontend (`client/`)
* **Framework**: React 19, Vite 6, React Router DOM v7
* **State Management**: Redux Toolkit, React Redux
* **Styling & Animation**: Tailwind CSS v4, Motion (Framer Motion)
* **Authentication**: Firebase Client SDK (Google OAuth)
* **HTTP Client**: Axios (configured with cookies/credentials)
* **Local State / Draft Storage**: Custom windowed session storage helpers for resuming active interviews
* **Visualization**: Recharts, react-circular-progressbar
* **PDF Export**: jsPDF + jspdf-autotable
* **Icons**: React Icons
* **UI Primitives**: Radix UI Slot, Class Variance Authority (CVA), Clsx, Tailwind Merge

### Backend (`server/`)
* **Runtime**: Node.js (ESM modules)
* **Framework**: Express 5 (supporting WebSocket integration via `express-ws`)
* **Database**: MongoDB (via Mongoose 9) with dual connection streams (App database & Resume blob database)
* **Authentication & Credentials**: JSON Web Token (JWT) with HTTP-only cookies verified against Firebase Admin SDK
* **AI Service**: OpenRouter API (`openai/gpt-oss-120b:free` model) with modular Prompts Builder
* **Audio Processing**: Deepgram SDK integration via WebSockets (`wss://api.deepgram.com`)
* **Payment Processor**: Razorpay SDK
* **PDF Parser**: `pdfjs-dist` (legacy build for extracting text from resume uploads)
* **File Upload**: Multer

---

## 🏗️ Architecture

```mermaid
graph TD
    Client[React Frontend <br> localhost:5173] <-->|REST API / WebSockets <br> Axios + Cookies/JWT| Server[Express Backend <br> localhost:8000]
    Server <-->|Mongoose Connections| MongoMainDB[(App MongoDB)]
    Server <-->|Mongoose Connections| MongoResumeDB[(Resume MongoDB)]
    Server <-->|Completions API| OpenRouter[OpenRouter AI Service <br> openai/gpt-oss-120b:free]
    Server <-->|WebSocket Stream| Deepgram[Deepgram Speech-to-Text]
    Server <-->|Payments API| Razorpay[Razorpay Gateway]
```

### Monorepo Structure
```
ai_mock_interview/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── assets/         # Audio, video, and image assets
│   │   ├── components/     # UI Components (Step1SetUp, Step2Interview, Step3Report, ErrorBoundary, ProtectedRoute, Navbar, Footer)
│   │   │   └── ui/         # Base UI components (button, 404-page-not-found)
│   │   ├── lib/            # Shared libraries and helper utilities (utils.js defining cn helper)
│   │   ├── pages/          # Page views (Home, Auth, InterviewPage, InterviewHistory, Pricing, InterviewReport, NotFound)
│   │   ├── redux/          # Redux Toolkit store (store.js, userSlice.js)
│   │   └── utils/          # Helper utilities (firebase.js, draftStorage.js)
│   └── package.json
└── server/                 # Express backend application
    ├── config/             # DB & Admin setup (connectDB.js, resumeDB.js, token.js, firebaseAdmin.js)
    ├── controllers/        # Route logic (auth, user, interview, payment, deepgram)
    ├── middlewares/        # Express middlewares (auth, multer)
    ├── models/             # Mongoose schemas (User, Interview, Resume, Payment)
    ├── routes/             # Router mappings (auth, user, interview, payment, deepgram)
    ├── services/           # Service layer wrappers (AIService.js, AuthService.js, InterviewService.js, PromptBuilder.js, razorpay.service.js)
    ├── index.js            # App entry point with express-ws initialization
    └── package.json
```

---

## ⚙️ Environment Setup

### 1. Set Up the Backend
Navigate to the `server/` directory and create a `.env` file:
```bash
cd server
```

Create a `.env` file containing the following variables:
```env
PORT=8000
MONGODB_URL=your_mongodb_connection_string
RESUME_MONGODB_URL=your_resume_specific_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
OPENROUTER_API_KEY=your_openrouter_api_key
CLIENT_URL=http://localhost:5173  # Comma-separated list of allowed origins

# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Deepgram Integration
DEEPGRAM_API_KEY=your_deepgram_api_key

# Payment Integration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 2. Set Up the Frontend
Navigate to the `client/` directory and create a `.env` file:
```bash
cd ../client
```

Create a `.env` file containing the following variables:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_SERVER_URL=http://localhost:8000 # Optional, defaults to http://localhost:8000
```

> **Note**: Ensure that Google Authentication is enabled under the Authentication settings in your Firebase project console.

---

## 🚀 Running the Application

### Start Backend Server
```bash
cd server
npm install
npm run dev
```
Runs the Express server with WebSocket support on [http://localhost:8000](http://localhost:8000).

### Start Frontend Client
```bash
cd client
npm install
npm run dev
```
Runs the Vite development server on [http://localhost:5173](http://localhost:5173).

---

## 📋 Interview Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Candidate
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant DG as Deepgram (via WS)
    participant AI as OpenRouter AI

    User->>FE: 1. Input parameters & Upload Resume PDF
    FE->>BE: POST /api/interview/resume (Multer)
    BE->>AI: Extract Role/Experience/Projects/Skills from PDF
    AI-->>BE: Extracted Profile JSON
    BE-->>FE: Populate fields & projects list in Setup Screen
    User->>FE: Click "Start Interview"
    FE->>BE: POST /api/interview/generate-questions (deducts 10 credits per question, e.g., 50 credits for 5 questions)
    BE->>AI: Generate N custom questions (Technical/HR)
    AI-->>BE: N Questions with Diff/Time Limit
    BE-->>FE: Display Step 2 (Interview Screen)
    loop For Question 1 to N
        FE->>User: Play video avatar & TTS Question
        alt Speak Answer (Voice Mode)
            FE->>BE: Connect Web Socket: WS /api/deepgram/live
            BE->>DG: Pipe audio buffer to Deepgram WS
            DG-->>BE: Real-time Transcript stream
            BE-->>FE: Live STT transcript display
        else Type Answer (Text Mode)
            User->>FE: Type answer directly in Textarea
        end
        FE->>BE: POST /api/interview/submit-answer
        BE->>AI: Evaluate Answer (Confidence, Communication, Correctness)
        AI-->>BE: Score & Feedback JSON
        BE-->>FE: Speaks feedback to user
        alt Score is low / User triggers follow-up
            FE->>BE: POST /api/interview/follow-up
            BE->>AI: Generate relevant follow-up question
            AI-->>BE: Follow-up question JSON
            BE-->>FE: Speaks follow-up to user
        end
    end
    FE->>BE: POST /api/interview/finish
    BE-->>FE: Aggregated Final Report JSON
    FE->>User: Display Step 3 (Report Screen with Charts & Dynamic Averages)
    User->>FE: Download Sanitized Report as PDF (Name & Role in Filename)
```

### Credit System Logic
- New users start with **300 credits** by default.
- Launching an interview costs **10 credits per question** generated (e.g., a standard 5-question interview costs **50 credits**).
- Credits are deducted at the question generation stage (`generate-questions`), and the user must possess at least the required credit cost to begin the session.

---

## 🛠️ API Documentation

Interactive Swagger (OpenAPI 3.0) documentation is served directly from the server. You can view, test, and interact with the API endpoints by navigating to:
* **Local Development**: `http://localhost:8000/api-docs`
Below is a summary of the available API namespaces:

### Authentication (`/api/auth`)
* `POST /api/auth/google` - Verifies Firebase ID Token, logs in/creates the user, and signs/issues JWT in an HTTP-only cookie.
* `GET /api/auth/logout` - Clears the session cookie.

### User Configuration (`/api/user`)
* `GET /api/user/current-user` - Returns the authenticated user's profile and credits.

### Interview Management (`/api/interview`)
* `POST /api/interview/resume` - Accepts a resume PDF via Multer, saves a compressed version to the resume database, extracts textual data using `pdfjs-dist`, and structures details via AI.
* `POST /api/interview/generate-questions` - Creates N customized questions (combining difficulty level with resume projects), constructs an `Interview` entry, and deducts credits (10 credits per question).
* `POST /api/interview/submit-answer` - Grades the current response graded across 3 dimensions (0-10 scale), logs history, and gives 10-15 word feedback.
* `POST /api/interview/follow-up` - Dynamically generates follow-up context in response to weak answers.
* `POST /api/interview/share/:id` - Creates/registers a public share key for an interview session report.
* `POST /api/interview/finish` - Signals completion, generates a session summary, classifies topics, compiles weak categories into an improvement plan, and returns final scores.
* `GET /api/interview/get-interviews` - Lists historical user interviews.
* `GET /api/interview/progress` - Loads the latest draft of incomplete sessions.
* `GET /api/interview/resume/:id` - Restores and resumes an incomplete interview from the draft state.
* `GET /api/interview/report/:id` - Fetches the complete private report.
* `GET /api/interview/public/:id` - Fetches report details for public viewing (bypasses auth gate).

### Payment Operations (`/api/payment`)
* `POST /api/payment/order` - Generates a Razorpay payment order for purchasing credit plans.
* `POST /api/payment/verify` - Verifies Razorpay HMAC signature and increments user's credits upon confirmation.

### WebSockets (`/api/deepgram/live`)
* `WS /api/deepgram/live` - Proxies raw microphone input to Deepgram live API, returning real-time transcription data.

### Routing Fallbacks
* **Frontend Wildcard Routing**: Any unmatched client path (`*`) is routed to the new custom `NotFound` page using React Router.
* **Backend API Fallback**: Any unmatched API endpoint returns a standard JSON error response (`{ message: "API endpoint not found" }` with a 404 status code).

---

## 📄 License
This project is open-source and licensed under the MIT License.
