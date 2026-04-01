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

// Middleware — allowed origins: set FRONTEND_URL in production env
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://10.228.78.131:5173',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Initialize Socket.io
initSocket(server);

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
