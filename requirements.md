# Requirements Document

## Introduction

SWASTHYA-FLOW is an Offline-First, Predictive OPD (Outpatient Department) Orchestrator built for a 24-hour hackathon. It manages patient token queues across three roles — Reception, Doctor, and Patient — with real-time synchronization via Socket.io, offline resilience via IndexedDB (Dexie.js) and a Service Worker, and a predictive wait-time estimator using rolling averages of consultation durations.

This document defines the data contracts, logic specifications, and integration points for a 3-member team to build in parallel without merge conflicts.

---

## Glossary

- **Token**: A record representing a patient's place in the OPD queue for a given session, identified by a token number.
- **Queue**: The ordered list of Tokens for an active DoctorSession.
- **DoctorSession**: A record representing a doctor's active OPD session, tracking consultation timing data used by the Wait-Estimator.
- **Wait-Estimator**: The client-side algorithm that predicts a patient's expected wait time using a rolling average of past consultation durations within the current DoctorSession.
- **Reception**: The role responsible for registering new patients and generating Tokens.
- **Doctor**: The role responsible for calling the next patient and closing consultations.
- **Patient**: The role that views their queue status via a QR-linked URL.
- **Offline-First**: The system design principle where all critical read/write operations work without a network connection, syncing to the server when connectivity is restored.
- **IndexedDB**: Browser-side persistent storage managed via Dexie.js, used as the local source of truth when offline.
- **Service Worker**: A browser script that intercepts network requests and manages caching for PWA offline support.
- **Socket.io**: The real-time bidirectional event library used for pushing queue state changes to all connected clients.
- **Rolling Average**: The mean of the last N consultation durations, used by the Wait-Estimator to predict future consultation times.
- **apiService**: The frontend service module that wraps all REST API calls.
- **socketService**: The frontend service module that manages the Socket.io connection lifecycle and event subscriptions.

---

## Requirements

### Requirement 1: Token Creation (Reception Role)

**User Story:** As a receptionist, I want to register a new patient and generate a token, so that the patient is added to the OPD queue.

#### Acceptance Criteria

1. WHEN the Reception submits a new patient registration, THE API_Server SHALL create a Token record and return the assigned token number and estimated wait time.
2. WHEN a Token is created successfully, THE API_Server SHALL emit a `NEW_PATIENT_JOINED` Socket.io event to all connected clients with the updated queue payload.
3. IF the Reception client is offline at the time of registration, THEN THE Offline_Sync_Module SHALL persist the Token creation request to IndexedDB and mark it as `pending_sync`.
4. WHEN the Reception client reconnects to the network, THE Offline_Sync_Module SHALL replay all `pending_sync` operations to the API_Server in the order they were created.
5. THE Token record SHALL contain the fields: `tokenId`, `tokenNumber`, `patientName`, `status`, `sessionId`, `createdAt`, `calledAt`, `completedAt`.

---

### Requirement 2: Queue Retrieval

**User Story:** As any role (Reception, Doctor, Patient), I want to fetch the current queue state, so that I can display accurate patient order and wait times.

#### Acceptance Criteria

1. WHEN a client requests the current queue, THE API_Server SHALL return an ordered array of Token records for the active DoctorSession.
2. THE API_Server SHALL return tokens ordered by `tokenNumber` ascending, filtered to exclude tokens with `status` of `completed`.
3. WHEN a client is offline, THE Queue_Cache SHALL serve the last-known queue state from IndexedDB.
4. WHEN the client transitions from offline to online, THE Offline_Sync_Module SHALL fetch a fresh queue snapshot from the API_Server and update IndexedDB.

---

### Requirement 3: Doctor Calls Next Patient

**User Story:** As a doctor, I want to call the next patient in the queue, so that the patient knows to enter the consultation room.

#### Acceptance Criteria

1. WHEN the Doctor triggers "Call Next", THE API_Server SHALL update the next pending Token's `status` to `called` and set its `calledAt` timestamp.
2. WHEN a Token status is updated to `called`, THE API_Server SHALL emit a `CALL_NEXT_PATIENT` Socket.io event to all connected clients with the `tokenId` and `tokenNumber` of the called patient.
3. WHEN the Doctor marks a consultation as complete, THE API_Server SHALL set the Token's `status` to `completed` and set its `completedAt` timestamp.
4. WHEN a Token is marked `completed`, THE API_Server SHALL update the DoctorSession's `consultationDurations` array by appending the duration in seconds computed as `completedAt - calledAt`.
5. WHEN a Token is marked `completed`, THE API_Server SHALL emit a `QUEUE_UPDATED` Socket.io event to all connected clients with the full refreshed queue payload.
6. IF no pending Token exists in the queue when the Doctor triggers "Call Next", THEN THE API_Server SHALL return a 404 response with the message `"No pending patients in queue"`.

---

### Requirement 4: Patient Queue Status View

**User Story:** As a patient, I want to view my queue position and estimated wait time via a QR-linked URL, so that I can track when I will be called without needing to wait at the counter.

#### Acceptance Criteria

1. WHEN a Patient navigates to the status URL containing their `tokenId`, THE Patient_View SHALL fetch and display the Token's current `status`, `tokenNumber`, and estimated wait time.
2. WHILE the Patient_View is open, THE socketService SHALL maintain a Socket.io connection and update the displayed status in real time upon receiving `QUEUE_UPDATED` or `CALL_NEXT_PATIENT` events.
3. WHEN the Patient's token `status` changes to `called`, THE Patient_View SHALL display a prominent notification that the patient should proceed to the consultation room.
4. WHEN the Patient client is offline, THE Patient_View SHALL display the last-known status from IndexedDB and show an offline indicator.

---

### Requirement 5: Predictive Wait-Estimator

**User Story:** As any user, I want to see a predicted wait time for each patient in the queue, so that patients and staff can plan accordingly.

#### Acceptance Criteria

1. THE Wait_Estimator SHALL compute the estimated wait time for a token at position `P` (1-indexed among pending tokens) as: `estimatedWait = P × rollingAverageConsultationTime`.
2. THE Wait_Estimator SHALL compute `rollingAverageConsultationTime` as the mean of the last `N` values in the DoctorSession's `consultationDurations` array, where `N` is configurable and defaults to `5`.
3. WHEN the DoctorSession's `consultationDurations` array contains fewer than `N` entries, THE Wait_Estimator SHALL use all available entries to compute the average.
4. WHEN the DoctorSession's `consultationDurations` array is empty, THE Wait_Estimator SHALL return a default estimate of `300` seconds (5 minutes) per patient.
5. THE Wait_Estimator SHALL be implemented as a pure JavaScript function that accepts `(position: number, consultationDurations: number[], windowSize: number)` and returns a number in seconds.
6. FOR ALL valid inputs where `consultationDurations` is non-empty, applying the Wait_Estimator then appending a new duration and re-applying SHALL produce a result that reflects the updated rolling average (round-trip consistency of state updates).

---

### Requirement 6: Real-Time Synchronization Contract

**User Story:** As a developer, I want a defined Socket.io event contract, so that frontend and backend team members can build against the same interface without conflicts.

#### Acceptance Criteria

1. THE socketService SHALL emit and handle exactly the following named events: `NEW_PATIENT_JOINED`, `CALL_NEXT_PATIENT`, `QUEUE_UPDATED`, `SESSION_STARTED`, `SESSION_ENDED`.
2. WHEN the server emits `NEW_PATIENT_JOINED`, THE payload SHALL conform to the shape: `{ token: TokenObject, queue: TokenObject[] }`.
3. WHEN the server emits `CALL_NEXT_PATIENT`, THE payload SHALL conform to the shape: `{ tokenId: string, tokenNumber: number, queue: TokenObject[] }`.
4. WHEN the server emits `QUEUE_UPDATED`, THE payload SHALL conform to the shape: `{ queue: TokenObject[] }`.
5. WHEN the server emits `SESSION_STARTED`, THE payload SHALL conform to the shape: `{ session: DoctorSessionObject }`.
6. WHEN the server emits `SESSION_ENDED`, THE payload SHALL conform to the shape: `{ sessionId: string }`.
7. IF a Socket.io connection is lost, THEN THE socketService SHALL attempt reconnection with exponential backoff, with a maximum retry interval of `30000` milliseconds.

---

### Requirement 7: Database Schema Contract

**User Story:** As a developer, I want a defined database schema, so that all team members write queries against the same field names and types.

#### Acceptance Criteria

1. THE Token collection SHALL use the following schema:
   - `tokenId`: string (UUID, primary key)
   - `tokenNumber`: number (auto-incremented per session)
   - `patientName`: string
   - `status`: string, one of `["pending", "called", "completed"]`
   - `sessionId`: string (foreign key to DoctorSession)
   - `createdAt`: number (Unix timestamp ms)
   - `calledAt`: number | null (Unix timestamp ms)
   - `completedAt`: number | null (Unix timestamp ms)
2. THE DoctorSession collection SHALL use the following schema:
   - `sessionId`: string (UUID, primary key)
   - `doctorName`: string
   - `status`: string, one of `["active", "closed"]`
   - `consultationDurations`: number[] (array of durations in seconds)
   - `startedAt`: number (Unix timestamp ms)
   - `closedAt`: number | null (Unix timestamp ms)
3. THE IndexedDB store (Dexie.js) SHALL mirror the Token and DoctorSession schemas with an additional `syncStatus` field on Token: string, one of `["synced", "pending_sync"]`.

---

### Requirement 8: Offline-First Service Worker Strategy

**User Story:** As a developer, I want a defined caching strategy, so that the PWA works reliably offline and the team member owning the Service Worker knows exactly what to cache.

#### Acceptance Criteria

1. THE Service_Worker SHALL use a Cache-First strategy for all static assets (JS bundles, HTML, icons).
2. WHEN a GET request to `/api/queue` is made and the network is unavailable, THE Service_Worker SHALL return the last cached response for that URL.
3. WHEN a POST request to `/api/tokens` is made and the network is unavailable, THE Service_Worker SHALL queue the request using the Background Sync API and return a synthetic `202 Accepted` response to the client.
4. WHEN the network becomes available, THE Service_Worker SHALL replay all queued POST requests via the Background Sync API.
5. THE Service_Worker SHALL version its cache using a `CACHE_NAME` constant that includes the build version, so that stale caches are invalidated on deployment.

---

### Requirement 9: Modular Frontend Structure and File Ownership

**User Story:** As a team lead, I want a defined folder structure and file ownership map, so that three developers can work in parallel without merge conflicts.

#### Acceptance Criteria

1. THE Frontend codebase SHALL be organized into the following top-level directories under `src/`: `hooks/`, `services/`, `context/`, `pages/`, `utils/`.
2. THE `hooks/` directory SHALL contain: `useQueue.js` (owned by Doctor role developer), `useOfflineSync.js` (owned by Reception role developer), `usePatientStatus.js` (owned by Patient role developer).
3. THE `services/` directory SHALL contain: `apiService.js` (shared, owned by backend integration lead), `socketService.js` (shared, owned by backend integration lead).
4. THE `context/` directory SHALL contain: `QueueContext.js` providing global queue state, consumed by all role pages.
5. THE `pages/` directory SHALL contain: `ReceptionPage.js` (owned by Reception developer), `DoctorPage.js` (owned by Doctor developer), `PatientStatusPage.js` (owned by Patient developer).
6. THE `utils/` directory SHALL contain: `waitEstimator.js` (pure function, owned by backend integration lead).
7. WHEN two developers need to share state, THE shared state SHALL be passed through `QueueContext.js` only, and direct imports between page files SHALL NOT occur.
