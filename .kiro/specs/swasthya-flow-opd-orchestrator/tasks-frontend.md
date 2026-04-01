# Frontend Implementation Plan — SWASTHYA-FLOW

## Overview

Tasks for the React.js + Dexie.js + Service Worker frontend. Three developers work in parallel after Task 1 (shared setup) is complete. File ownership is enforced to prevent merge conflicts.

---

## File Ownership Map

| File | Owner |
|---|---|
| `src/services/apiService.js` | Dev 1 (Backend Integration Lead) |
| `src/services/socketService.js` | Dev 1 (Backend Integration Lead) |
| `src/utils/waitEstimator.js` | Dev 1 (Backend Integration Lead) |
| `src/context/QueueContext.js` | Dev 1 (Backend Integration Lead) |
| `src/hooks/useQueue.js` | Dev 2 (Doctor Role) |
| `src/pages/DoctorPage.js` | Dev 2 (Doctor Role) |
| `src/hooks/useOfflineSync.js` | Dev 3 (Reception Role) |
| `src/pages/ReceptionPage.js` | Dev 3 (Reception Role) |
| `src/hooks/usePatientStatus.js` | Dev 3 (Patient Role) — or reassign to Dev 2 if capacity allows |
| `src/pages/PatientStatusPage.js` | Dev 3 (Patient Role) |
| `public/sw.js` | Dev 1 (Backend Integration Lead) |

---

## Tasks

- [ ] 1. Project Setup (Dev 1 — do first, unblocks everyone)
  - [ ] 1.1 Bootstrap React app (`create-react-app` or Vite), install dependencies: `socket.io-client`, `dexie`, `react-router-dom`, `fast-check` (dev)
  - [ ] 1.2 Create folder structure: `src/hooks/`, `src/services/`, `src/context/`, `src/pages/`, `src/utils/`
  - [ ] 1.3 Create stub files for every owned file (empty exports) so all developers can import without errors from day one
  - [ ] 1.4 Set up React Router in `src/App.js` with routes: `/reception`, `/doctor`, `/patient/:tokenId`
  - [ ] 1.5 Register Service Worker in `src/index.js`

- [ ] 2. Shared Services (Dev 1)
  - [ ] 2.1 Implement `src/services/apiService.js` — six methods matching the API contract: `createToken`, `getQueue`, `callNext`, `completeConsultation`, `startSession`, `endSession`; reject with `{ status, message }` on non-2xx
  - [ ] 2.2 Implement `src/services/socketService.js` — `connect()`, `disconnect()`, `on(event, handler)`, `off(event, handler)`; exponential backoff reconnection capped at 30 000 ms (Property 12)
  - [ ] 2.3 Write unit tests for `apiService` URL construction and error propagation
  - [ ] 2.4 Write property test for `socketService` reconnection backoff bound (Property 12, `fast-check`, min 100 iterations)

- [ ] 3. Dexie.js Database (Dev 1)
  - [ ] 3.1 Create `src/db.js` — initialise Dexie, define version 1 schema: `tokens` table (`tokenId, sessionId, status, syncStatus, tokenNumber`) and `sessions` table (`sessionId, status`)
  - [ ] 3.2 Export `db` singleton for use by hooks

- [ ] 4. QueueContext (Dev 1)
  - [ ] 4.1 Implement `src/context/QueueContext.js` — provide `{ queue, session, isOnline, dispatch }` via React Context; listen to `window` online/offline events to update `isOnline`
  - [ ] 4.2 Wrap `src/App.js` with `<QueueContext.Provider>`

- [ ] 5. Wait Estimator (Dev 1)
  - [ ] 5.1 Implement `src/utils/waitEstimator.js` — pure function `estimateWait(position, consultationDurations, windowSize = 5)`: return `position × mean(durations.slice(-windowSize))`; return `position × 300` when array is empty
  - [ ] 5.2 Write unit tests for specific numeric examples and boundary cases (N=0, N=1, N > durations.length)
  - [ ] 5.3 Write property tests for rolling average correctness (Property 8), empty-default (Property 9), and round-trip consistency (Property 10) using `fast-check`, min 100 iterations each

- [ ] 6. useOfflineSync Hook (Dev 3 — Reception)
  - [ ] 6.1 Implement `src/hooks/useOfflineSync.js` — expose `createTokenWithSync(patientName, sessionId)`: if online call `apiService.createToken` and write result to Dexie with `syncStatus: "synced"`; if offline write to Dexie with `syncStatus: "pending_sync"` and return synthetic response
  - [ ] 6.2 On mount, add `online` event listener; when fired, read all Dexie tokens with `syncStatus: "pending_sync"` ordered by `createdAt` ascending, replay each via `apiService.createToken`, update `syncStatus` to `"synced"` on success
  - [ ] 6.3 Write property test for offline persistence and replay order (Property 2, `fast-check`, min 100 iterations)

- [ ] 7. ReceptionPage (Dev 3 — Reception)
  - [ ] 7.1 Implement `src/pages/ReceptionPage.js` — form with `patientName` input; on submit call `useOfflineSync.createTokenWithSync`; consume `QueueContext` to display current queue with wait times from `waitEstimator`
  - [ ] 7.2 Show offline indicator banner when `QueueContext.isOnline === false`

- [ ] 8. useQueue Hook (Dev 2 — Doctor)
  - [ ] 8.1 Implement `src/hooks/useQueue.js` — on mount fetch queue via `apiService.getQueue` and write to Dexie; subscribe to `QUEUE_UPDATED` and `NEW_PATIENT_JOINED` via `socketService` to update local state; expose `callNext()` and `completeConsultation(tokenId)` actions
  - [ ] 8.2 When offline, read queue from Dexie instead of API (Property 4)
  - [ ] 8.3 On transition from offline to online, re-fetch fresh queue from API and update Dexie

- [ ] 9. DoctorPage (Dev 2 — Doctor)
  - [ ] 9.1 Implement `src/pages/DoctorPage.js` — display queue list with token numbers, patient names, and estimated wait times; "Call Next" button calls `useQueue.callNext()`; "Complete" button per called token calls `useQueue.completeConsultation(tokenId)`
  - [ ] 9.2 Show offline indicator when `QueueContext.isOnline === false`

- [ ] 10. usePatientStatus Hook (Dev 3 — Patient)
  - [ ] 10.1 Implement `src/hooks/usePatientStatus.js` — accept `tokenId`; fetch token status via `apiService`; subscribe to `QUEUE_UPDATED` and `CALL_NEXT_PATIENT` socket events; update local state when the patient's token is affected
  - [ ] 10.2 When offline, read token from Dexie

- [ ] 11. PatientStatusPage (Dev 3 — Patient)
  - [ ] 11.1 Implement `src/pages/PatientStatusPage.js` — read `tokenId` from URL params; use `usePatientStatus`; display `status`, `tokenNumber`, and estimated wait time
  - [ ] 11.2 When `status === "called"`, display a prominent "Please proceed to the consultation room" notification
  - [ ] 11.3 Show offline indicator when `QueueContext.isOnline === false`

- [ ] 12. Service Worker (Dev 1)
  - [ ] 12.1 Implement `public/sw.js` — define versioned `CACHE_NAME` constant (e.g. `swasthya-flow-v1`)
  - [ ] 12.2 On `install` event: pre-cache all static assets (HTML, JS bundles, icons)
  - [ ] 12.3 On `fetch` event for static assets: Cache-First strategy
  - [ ] 12.4 On `fetch` event for `GET /api/queue`: Network-first; on network failure return cached response
  - [ ] 12.5 On `fetch` event for `POST /api/tokens` while offline: register Background Sync tag `sync-tokens`, return synthetic `202 Accepted` response
  - [ ] 12.6 On `sync` event with tag `sync-tokens`: replay all queued POST requests
  - [ ] 12.7 On `activate` event: delete all caches not matching current `CACHE_NAME`
  - [ ] 12.8 Write property test for Background Sync replay (Property 13, `fast-check`, min 100 iterations)

- [ ] 13. Integration & Property Test Tagging
  - [ ] 13.1 Ensure every property-based test file includes the comment tag `// Feature: swasthya-flow-opd-orchestrator, Property <N>: <text>`
  - [ ] 13.2 Confirm all `fast-check` runs use `{ numRuns: 100 }` minimum
  - [ ] 13.3 Run full test suite (`npm test -- --run`) and confirm all tests pass before final demo
