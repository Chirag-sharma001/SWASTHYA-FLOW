# Backend Implementation Plan — SWASTHYA-FLOW

## Overview

Tasks for the Node.js + Express + MongoDB + Socket.io backend. One developer owns this track. Work top-to-bottom; each task unblocks the next.

---

## Tasks

- [ ] 1. Project Setup
  - [ ] 1.1 Initialise Node.js project (`npm init`), install dependencies: `express`, `mongoose`, `socket.io`, `uuid`, `cors`, `dotenv`
  - [ ] 1.2 Create folder structure: `src/models/`, `src/routes/`, `src/controllers/`, `src/socket/`, `src/middleware/`
  - [ ] 1.3 Create `src/index.js` — boot Express + attach Socket.io server + connect Mongoose
  - [ ] 1.4 Add `.env` with `MONGO_URI`, `PORT`; add `.env.example`

- [ ] 2. Database Models
  - [ ] 2.1 Create `src/models/Token.js` — Mongoose schema matching the Token contract (`tokenId` UUID, `tokenNumber`, `patientName`, `status` enum, `sessionId`, `createdAt`, `calledAt`, `completedAt`)
  - [ ] 2.2 Create `src/models/DoctorSession.js` — Mongoose schema (`sessionId` UUID, `doctorName`, `status` enum, `consultationDurations` array, `startedAt`, `closedAt`)
  - [ ] 2.3 Write unit tests for schema validation and required-field enforcement

- [ ] 3. Session Routes
  - [ ] 3.1 `POST /api/sessions` — create DoctorSession, emit `SESSION_STARTED` with `{ session: DoctorSessionObject }`
  - [ ] 3.2 `POST /api/sessions/:id/end` — set `status: "closed"`, set `closedAt`, emit `SESSION_ENDED` with `{ sessionId }`
  - [ ] 3.3 Return 404 `{ error: "Session not found" }` when session does not exist

- [ ] 4. Token Routes
  - [ ] 4.1 `POST /api/tokens` — validate `patientName` + `sessionId`, auto-increment `tokenNumber` per session, create Token with `status: "pending"`, emit `NEW_PATIENT_JOINED` with `{ token, queue }`
  - [ ] 4.2 `GET /api/queue/:sessionId` — return tokens for session ordered by `tokenNumber` ascending, excluding `status: "completed"`
  - [ ] 4.3 `POST /api/sessions/:id/call-next` — find lowest `tokenNumber` pending token, set `status: "called"` + `calledAt: Date.now()`, emit `CALL_NEXT_PATIENT` with `{ tokenId, tokenNumber, queue }`; return 404 `{ error: "No pending patients in queue" }` if none
  - [ ] 4.4 `POST /api/tokens/:id/complete` — set `status: "completed"` + `completedAt: Date.now()`, compute duration `(completedAt - calledAt) / 1000` in seconds, push to session `consultationDurations`, emit `QUEUE_UPDATED` with `{ queue }`
  - [ ] 4.5 Return 404 `{ error: "Token not found" }` when token does not exist

- [ ] 5. Socket.io Server
  - [ ] 5.1 Create `src/socket/index.js` — initialise Socket.io, attach to HTTP server, export `emitEvent(eventName, payload)` helper
  - [ ] 5.2 Verify all five event names are used only via the helper: `NEW_PATIENT_JOINED`, `CALL_NEXT_PATIENT`, `QUEUE_UPDATED`, `SESSION_STARTED`, `SESSION_ENDED`
  - [ ] 5.3 Write unit test asserting each emitted payload matches the contract shape (Property 11)

- [ ] 6. Error Handling Middleware
  - [ ] 6.1 Create `src/middleware/errorHandler.js` — catch-all Express error middleware returning `{ error: message }` with correct status codes
  - [ ] 6.2 Return 400 for missing required fields, 404 for not-found, 500 for unexpected errors

- [ ] 7. Backend Unit & Property Tests
  - [ ] 7.1 `POST /api/tokens` happy path — queue length increases by 1 (Property 1)
  - [ ] 7.2 `GET /api/queue` ordering invariant — all returned tokens ordered ascending, none `completed` (Property 3)
  - [ ] 7.3 `call-next` transitions lowest pending token to `called` (Property 5)
  - [ ] 7.4 `complete` appends correct duration to `consultationDurations` (Property 6)
  - [ ] 7.5 `call-next` on empty queue returns 404 (Property 7)
  - [ ] 7.6 Socket payload shape invariant using `fast-check` (Property 11)
  - [ ] 7.7 All property tests tagged `// Feature: swasthya-flow-opd-orchestrator, Property <N>: <text>` and run minimum 100 iterations

- [ ] 8. CORS & Environment Config
  - [ ] 8.1 Enable CORS for the React dev origin (`http://localhost:3000`) via `cors` middleware
  - [ ] 8.2 Confirm all env vars are read from `.env` via `dotenv`; no hard-coded values in source
