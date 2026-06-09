# Features Roadmap — AI Mock Interview Platform

> Derived from codebase analysis (graph: 32 communities, 1065 edges), `context.md`, and current `improvement` branch state.
> Grouped by impact tier. Each feature lists the exact files to create/modify.

---

## Tier 1 — High Impact, Low Effort (Ship Next Sprint)

---

### 1. Interview Pause & Resume

**Problem:** If the user closes the tab mid-interview, the session is lost. The `interviewId` and questions exist in MongoDB but there is no way to re-enter them.

**What to build:**
- On `/interview` mount, check `localStorage` for an `activeInterviewId`
- If found, fetch `/api/interview/resume/:id` which returns the interview doc with unanswered questions starting from the first `answer === ""`
- Show a "Resume your last interview?" banner in `Step1SetUp`
- On finish or explicit abandon, clear `activeInterviewId`

**Files:**
- `server/services/InterviewService.js` — add `static async resumeInterview(interviewId, userId)`
- `server/controllers/interview.controller.js` — add `resumeInterview` handler
- `server/routes/interview.route.js` — `GET /resume/:id`
- `client/src/components/Step1SetUp.jsx` — resume banner UI
- `client/src/utils/draftStorage.js` — add `saveActiveInterview(id)`, `loadActiveInterview()`, `clearActiveInterview()`

---

### 2. Shareable Report Link

**Problem:** `/report/:id` already works but requires the user to be logged in (ProtectedRoute). Reports can't be shared with recruiters or friends.

**What to build:**
- Add a `isPublic: Boolean` field to `interviewSchema`
- `POST /api/interview/share/:id` sets `isPublic: true`, returns a public URL
- Create an unprotected route `/public/report/:id` that fetches with no auth
- "Share Report" button in `Step3Report` — copies link to clipboard with a toast

**Files:**
- `server/models/interview.model.js` — add `isPublic: { type: Boolean, default: false }`
- `server/services/InterviewService.js` — `makePublic(interviewId, userId)`
- `server/controllers/interview.controller.js` — `shareReport` handler
- `server/routes/interview.route.js` — `POST /share/:id`, `GET /public/:id` (no auth middleware)
- `client/src/App.jsx` — add `/public/report/:id` route (no ProtectedRoute)
- `client/src/components/Step3Report.jsx` — "Share" button + clipboard toast

---

### 3. Retry a Question

**Problem:** After getting feedback, there is no way to re-attempt the same question to practice improvement. The "Next Question" button is the only option.

**What to build:**
- Add a "Try Again" button alongside "Next Question" in the feedback panel of `Step2Interview`
- Re-uses the same `questionIndex` but clears the answer and feedback state, resets the timer, and starts a new mic session
- Does NOT call the API again — purely client-side reset
- Track `attemptCount` per question locally to cap at 2 retries

**Files:**
- `client/src/components/Step2Interview.jsx` — `handleRetry()` function, "Try Again" button in feedback section, `attemptCount` state

---

### 4. Interview Mode — Custom Question Count

**Problem:** Fixed 5 questions. Some users want a quick 2-question drill, others want a 10-question deep session.

**What to build:**
- Add a question count selector (2 / 5 / 8 / 10) to `Step1SetUp`
- Pass `count` in `POST /api/interview/generate-questions`
- `InterviewService.generateQuestions` slices the generated list to `count` and maps difficulty/timeLimit accordingly
- Credits scale: 50 base + 10 per question above 5

**Files:**
- `client/src/components/Step1SetUp.jsx` — count selector UI
- `server/services/InterviewService.js` — accept `count`, adjust `DIFFICULTY_MAP` / `TIME_LIMIT_MAP` dynamically
- `server/controllers/interview.controller.js` — pass `count` through

---

### 5. Answer Confidence Indicator (Live)

**Problem:** `getWordCountHint` gives passive word count feedback but doesn't coach on speaking pace or engagement level during the mic session.

**What to build:**
- While mic is active, show a live "speaking" animation with volume level bar using the `MediaStream` AudioContext API (`AnalyserNode`)
- Green = good audio signal, red = mic too quiet / too far
- This is purely frontend — no new API calls

**Files:**
- `client/src/components/Step2Interview.jsx` — `AudioContext` + `AnalyserNode` setup in `startMic()`, volume level state, animated bar UI below the mic button

---

## Tier 2 — High Impact, Medium Effort (Next 2 Sprints)

---

### 6. AI-Powered Question Bank (Save & Practice)

**Problem:** Once an interview ends, the questions are locked in that session. There is no way to practice individual questions in isolation.

**What to build:**
- New `QuestionBank` MongoDB collection: `{ question, topic, difficulty, role, mode, source: "ai" | "user", createdAt }`
- After every `finishInterview`, save all questions to the bank (deduplicate by text hash)
- New page `/practice` — browse questions by topic/role/difficulty, answer one at a time, get instant AI feedback (uses existing `evaluateAnswer` in `AIService`)
- Credits: 5 per practice answer (cheaper than full interview)

**Files (new):**
- `server/models/questionBank.model.js`
- `server/services/PracticeService.js`
- `server/controllers/practice.controller.js`
- `server/routes/practice.route.js`
- `client/src/pages/Practice.jsx`
- `client/src/App.jsx` — add `/practice` route

---

### 7. Interviewer Persona Selection

**Problem:** All interviews use the same neutral AI interviewer tone. Real interviews vary dramatically — Google SWE vs startup HR vs consulting case interview are completely different experiences.

**What to build:**
- 4 personas: `Friendly`, `Strict`, `Fast-paced`, `Consulting`
- Each persona maps to a different `PromptBuilder` system prompt variant — different tone, pacing instructions, and follow-up style
- Persona selector in `Step1SetUp` (icon cards)
- Persona stored on the `Interview` document

**Files:**
- `server/services/PromptBuilder.js` — add persona variants to `technicalQuestions()`, `hrQuestions()`, `answerEvaluation()`, `followUpQuestion()`
- `server/models/interview.model.js` — add `persona: { type: String, enum: ["friendly","strict","fast","consulting"], default: "friendly" }`
- `server/services/InterviewService.js` — pass `persona` to prompt builders
- `client/src/components/Step1SetUp.jsx` — persona selector UI

---

### 8. Real-Time Transcript Display During Answer

**Problem:** When the mic is on, the user can't see what Deepgram is transcribing until the 5-second silence flush. They don't know if their voice is being captured.

**What to build:**
- Add a `liveTranscript` state (separate from `answer`) to `Step2Interview`
- On every non-final Deepgram message, set `liveTranscript` to the current interim text
- Show it in a grey italic overlay below the textarea
- On silence flush, `liveTranscript` clears and the text moves to `answer`

**Files:**
- `client/src/components/Step2Interview.jsx` — `liveTranscript` state, update on `isFinal === false` messages, UI overlay

---

### 9. Streak & Gamification System

**Problem:** No retention mechanism. Users complete one interview and don't come back.

**What to build:**
- Track `lastInterviewDate` and `streak` on the `User` model
- After every `finishInterview`, update streak in `InterviewService`
- Show streak badge in `Navbar` and on the `Home` landing page
- Milestone badges: 3-day streak, 7-day streak, first HR interview, score ≥ 8

**Files:**
- `server/models/user.model.js` — add `streak: Number`, `lastInterviewDate: Date`, `badges: [String]`
- `server/services/InterviewService.js` — `#updateStreak(userId)` called in `finishInterview`
- `server/controllers/user.controller.js` — expose streak + badges in `getCurrentUser`
- `client/src/components/Navbar.jsx` — streak flame icon + count
- `client/src/pages/Home.jsx` — streak banner for returning users

---

### 10. Interview Scheduling / Reminder

**Problem:** Users intend to practice regularly but forget. There is no scheduling or reminder mechanism.

**What to build:**
- "Schedule Practice" button on the history page — pick a date/time
- Store schedule in a lightweight `schedules` collection
- Send a browser push notification via the Web Push API (`ServiceWorker` + `PushManager`)
- Backend: `POST /api/user/schedule`, `GET /api/user/schedules`

**Files (new):**
- `server/models/schedule.model.js`
- `server/controllers/schedule.controller.js`
- `server/routes/schedule.route.js`
- `client/src/utils/pushNotifications.js` — `requestPermission()`, `subscribePush()`
- `client/src/pages/InterviewHistory.jsx` — "Schedule" button + date picker
- `client/public/sw.js` — service worker for push handling

---

## Tier 3 — Differentiating Features (Future Sprints)

---

### 11. Company-Specific Interview Mode

**Problem:** "Technical interview" is too generic. Amazon Leadership Principles, Google system design, and Microsoft behavioral loops are completely different.

**What to build:**
- Add `company` field to interview setup: `Amazon | Google | Microsoft | Startup | Generic`
- Each company maps to a custom `PromptBuilder` variant with company-specific framing
- Amazon: forces STAR format, penalises answers without specific examples
- Google: focuses on scalability and edge cases
- Show company logo in the interview UI

**Files:**
- `server/services/PromptBuilder.js` — `companyTechnicalQuestions(company)`, `companyEvaluation(company)`
- `server/models/interview.model.js` — add `company: String`
- `client/src/components/Step1SetUp.jsx` — company selector with logos

---

### 12. Peer Comparison & Leaderboard

**Problem:** Users have no benchmark — a score of 6/10 means nothing without context.

**What to build:**
- Aggregate anonymised percentile rankings by role + experience band stored in a `Stats` collection (updated nightly via a cron-style background job triggered by `finishInterview`)
- After finishing, show "You scored better than 68% of candidates for React Developer with 1-2 years experience"
- `/leaderboard` page — top scores by role this week (opt-in, anonymised names)

**Files (new):**
- `server/models/stats.model.js` — `{ role, experience, mode, avgScore, p25, p50, p75, p90, updatedAt }`
- `server/services/StatsService.js` — `updateStats(role, experience, mode, score)`, `getPercentile(...)`
- `server/controllers/stats.controller.js`
- `server/routes/stats.route.js`
- `client/src/pages/Leaderboard.jsx`
- `client/src/components/Step3Report.jsx` — percentile badge below final score

---

### 13. Video Answer Recording & Playback

**Problem:** Body language, eye contact, and facial expressions are critical in real interviews. The platform evaluates only text.

**What to build:**
- Optional "Record Video" toggle in `Step2Interview` using `MediaRecorder` with `video/webm`
- Store blob in browser `IndexedDB` (not server — avoid storage costs)
- On the report page, show a thumbnail per question; click to replay the video answer alongside the AI feedback
- AI can optionally receive a transcript of filler words ("um", "uh", "like") extracted client-side for confidence scoring

**Files:**
- `client/src/utils/videoRecorder.js` — `startRecording()`, `stopRecording()`, `saveToIDB(questionIndex, blob)`, `loadFromIDB(questionIndex)`
- `client/src/components/Step2Interview.jsx` — video toggle, overlay recording indicator
- `client/src/components/Step3Report.jsx` — video playback per question card

---

### 14. AI Coaching Chat (Post-Interview)

**Problem:** The improvement plan gives bullet points but users can't ask follow-up questions like "Can you give me an example answer for Q3?"

**What to build:**
- After `finishInterview`, a "Chat with Coach" panel appears in `Step3Report`
- Uses a dedicated `PromptBuilder.coachChat(interviewContext)` system prompt that includes the full Q&A and scores as context
- Streaming responses via Server-Sent Events (SSE) — `res.write()` in Express
- Context window capped at last 6 messages to control tokens

**Files:**
- `server/services/PromptBuilder.js` — `coachChat(interviewContext)`
- `server/services/AIService.js` — `streamCoachReply(messages, res)` using axios stream
- `server/controllers/interview.controller.js` — `coachChat` handler with SSE headers
- `server/routes/interview.route.js` — `POST /coach-chat/:id`
- `client/src/components/CoachChat.jsx` — chat UI with streaming text render
- `client/src/components/Step3Report.jsx` — embed `CoachChat`

---

### 15. Resume Improvement Suggestions

**Problem:** `analyzeResume` extracts role/skills but throws away a huge opportunity — the resume itself could be critiqued.

**What to build:**
- After resume upload in `Step1SetUp`, show an optional "Review My Resume" section
- `AIService.reviewResume(resumeText, role)` — scores the resume on: clarity, quantified impact, keyword density for the target role, ATS compatibility
- Returns a structured JSON with section-by-section suggestions
- Displayed as a collapsible card before the interview starts

**Files:**
- `server/services/PromptBuilder.js` — `resumeReview(role)`
- `server/services/AIService.js` — `reviewResume(resumeText, role)`
- `server/services/InterviewService.js` — `reviewResume(file, role)`
- `server/controllers/interview.controller.js` — `reviewResume` handler
- `server/routes/interview.route.js` — `POST /resume/review`
- `client/src/components/Step1SetUp.jsx` — resume review card UI

---

## Infrastructure & Developer Experience

---

### 16. Request Logging Middleware

**Problem:** No request logging. When things break in production on Render, there is no visibility.

**What to build:**
- Lightweight `morgan` logger in dev (`dev` format) and production (`combined` format to stdout)
- Log slow AI responses (> 3s) with a warning tag

**Files:**
- `server/index.js` — `app.use(morgan(...))`
- `server/package.json` — add `morgan`

---

### 17. Global API Error Handler

**Problem:** Each controller has its own `sendError` or inline try/catch. Unhandled promise rejections that slip through return no response and hang the client.

**What to build:**
- Express `app.use((err, req, res, next) => ...)` global error handler as the last middleware in `index.js`
- All controllers `next(error)` instead of inline `res.status(500).json(...)`
- 404 handler for unknown routes

**Files:**
- `server/middlewares/errorHandler.js` — global error handler + 404 middleware
- `server/index.js` — register after all routes
- `server/controllers/*.js` — replace `sendError` pattern with `next(error)`

---

### 18. Input Sanitisation Middleware

**Problem:** User-supplied strings (`role`, `experience`, `answer`) go directly into AI prompts and MongoDB queries with no sanitisation. Risk: prompt injection, NoSQL injection.

**What to build:**
- `express-mongo-sanitize` to strip `$` operators from request bodies
- Trim and strip HTML tags from all string fields before they reach the service layer
- Cap all free-text string inputs at reasonable lengths at the route level

**Files:**
- `server/index.js` — `app.use(mongoSanitize())`
- `server/middlewares/sanitise.js` — string trim + html strip helper
- `server/package.json` — add `express-mongo-sanitize`

---


## What is Already Built (Do Not Re-implement)

| Feature | Location |
|---------|----------|
| Deepgram STT via raw WebSocket | `deepgram.controller.js` |
| 5-second silence buffer | `Step2Interview.jsx` — `silenceTimerRef` |
| Answer draft persistence | `utils/draftStorage.js` |
| Adaptive follow-up questions | `InterviewService.generateFollowUp` |
| Session memory in evaluation | `InterviewService.submitAnswer` — `priorQA` |
| AI executive summary | `InterviewService.finishInterview` — `generateSummary` |
| Topic classification | `InterviewService.finishInterview` — `classifyTopics` |
| Improvement plan | `InterviewService.finishInterview` — `generateImprovementPlan` |
| Progress line chart | `InterviewHistory.jsx` — recharts `LineChart` |
| Role / mode filter | `InterviewHistory.jsx` |
| Answer replay collapsible | `Step3Report.jsx` — `AnswerCollapsible` |
| Rate limiting | `middlewares/rateLimiter.js` — `aiLimiter`, `authLimiter` |
| Protected routes | `ProtectedRoute.jsx` |
| Error boundary | `ErrorBoundary.jsx` |
| Token-compressed prompts | `PromptBuilder.js`, `AIService.js` |
| Razorpay payment + verification | `payment.controller.js` |
| Health endpoint | `GET /health` in `index.js` |
