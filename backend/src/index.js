require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');

const { initSocket } = require('./socket');
const sessionRoutes = require('./routes/sessionRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const abhaRoutes = require('./routes/abhaRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Fail fast — don't buffer DB operations. If the DB isn't connected yet, throw
// immediately so the client gets a clear 503 error instead of a silent 10s timeout.
mongoose.set('bufferCommands', false);

if (!process.env.MONGO_URI) {
  console.error('[FATAL] MONGO_URI env var is not set. Set it in the Render dashboard under Environment Variables.');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 8000,   // give up selecting a server after 8s
  connectTimeoutMS: 10000,
}).then(() => {
  console.log('MongoDB connected successfully to', mongoose.connection.host);
}).catch(err => {
  console.error('[MongoDB] Connection failed:', err.message);
  // Don't exit — keep server alive so /health still responds
});

// Middleware — CORS
// Accepts localhost in dev, explicit FRONTEND_URL in prod, and any *.vercel.app preview URL.
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / curl (no origin header)
    if (!origin) return callback(null, true);

    const allowed = [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/10\.228\.78\.131:\d+$/,
      /\.vercel\.app$/,           // all Vercel preview & production URLs
    ];

    // Also allow the exact FRONTEND_URL if provided
    if (process.env.FRONTEND_URL) {
      allowed.push(new RegExp(`^${process.env.FRONTEND_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
    }

    const ok = allowed.some(r => (typeof r === 'string' ? r === origin : r.test(origin)));
    callback(ok ? null : new Error(`CORS blocked: ${origin}`), ok);
  },
  credentials: true,
}));
app.use(express.json());

// Initialize Socket.io
initSocket(server);

// Health-check — Render uses this; responds before MongoDB is ready
app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  // 1 = connected, 2 = connecting
  res.json({ status: 'ok', db: dbState === 1 ? 'connected' : 'connecting', ts: Date.now() });
});

// DB Readiness gate — all /api/* routes fail fast with 503 if DB not connected
// This prevents the 10s 'buffering timed out' hang on cold starts.
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Server is warming up — database not ready yet. Please retry in a few seconds.',
      retryAfter: 5,
    });
  }
  next();
});

// Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/abha', abhaRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
