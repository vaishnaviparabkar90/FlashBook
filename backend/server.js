import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';

import eventsRouter from './routes/events.js';
import lockSeatsRouter from './routes/lockSeats.js';
import paymentRouter from './routes/paymentRouter.js';
import userDataRoute from './routes/userData.js';
import { setupWebSocketServer } from './websocket.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS Setup
const allowedOrigins = [
  'https://flashboook.netlify.app',
  'http://localhost:5173'
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Routes
app.use('/events', eventsRouter);
app.get('/api/ping', (req, res) => res.send('pong'));
app.use('/api/lock-seats', lockSeatsRouter);
app.use('/api', userDataRoute);
app.use('/api2', paymentRouter);

// HTTP server
const server = http.createServer(app);

// WebSocket
setupWebSocketServer(server);

// Start
server.listen(PORT, () => {
  console.log(`✅ Server (HTTP + WS) running on port ${PORT}`);
});
