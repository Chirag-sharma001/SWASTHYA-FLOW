# Deployment Fix: 404 on Socket.IO & API

## Root Cause Summary

| Error | Cause |
|---|---|
| GET /socket.io/ → 404 | VITE_API_URL was empty → socket hit the Vercel frontend URL instead of Render backend |
| POST /api/sessions → 404 | Same — all API calls hit Vercel, which has no API server |
| CORS blocked | Socket.IO CORS was hardcoded to localhost only |

---

## Code Changes Already Applied

1. backend/src/index.js — CORS now uses regex, accepts all *.vercel.app origins automatically
2. backend/src/socket/index.js — Socket CORS reads from FRONTEND_URL env var; uses polling-first transports
3. frontend/src/services/socketService.js — Falls back to '' (same-origin/proxy) not window.location.origin
4. backend/src/index.js — Added /health endpoint (instant response, no DB required)
5. render.yaml — healthCheckPath changed to /health

---

## ACTION REQUIRED: Set Environment Variables

### Step 1 — Get your Render backend URL
render.com → swasthya-flow-backend service → copy the URL
Example: https://swasthya-flow-backend.onrender.com

### Step 2 — Set VITE_API_URL in Vercel (CRITICAL)
Vite env vars are baked in at build time. Must set in dashboard and REDEPLOY.

vercel.com → swasthqueuee project → Settings → Environment Variables → Add:
  Name:  VITE_API_URL
  Value: https://swasthya-flow-backend.onrender.com
  Environments: Production + Preview

Then: Deployments → Redeploy

### Step 3 — Set FRONTEND_URL in Render
render.com → swasthya-flow-backend → Environment → Add:
  Key:   FRONTEND_URL
  Value: https://swasthqueuee.vercel.app

Save Changes (Render auto-restarts)

---

## Deploy Order
1. git add . && git commit -m "fix: CORS, socket transport, health endpoint"
2. git push
3. Set FRONTEND_URL in Render dashboard
4. Set VITE_API_URL in Vercel dashboard
5. Trigger Vercel Redeploy manually
6. Check console: should see [Socket] Connected: <id>

## Verification
Network tab socket.io URL should be:
  https://swasthya-flow-backend.onrender.com/socket.io/?EIO=4&transport=polling
NOT:
  https://swasthqueuee.vercel.app/socket.io/...
