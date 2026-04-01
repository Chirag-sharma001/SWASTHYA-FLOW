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

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB connected successfully to', mongoose.connection.host);
}).catch(err => {
  console.error('MongoDB connection error details:', {
    message: err.message,
    name: err.name,
    code: err.code,
    reason: err.reason
  });
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

// Health-check — Render uses this; must respond before MongoDB is ready
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

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
