import express from 'express';
import http from 'http';
import cors from 'cors';
import eventsRouter from './routes/events.js';
import { setupWebSocketServer} from './websocket.js';
const app = express();
const PORT = process.env.PORT || 3000;
import lockSeatsRouter from './routes/lockSeats.js'; // Your seat locking route
import paymentRouter from './routes/paymentRouter.js';
import userDataRoute from './routes/userData.js';
app.use(express.json());

// CORS Setup
const allowedOrigins = [
  'https://flashboook.netlify.app',  // production frontend
  'http://localhost:5173'            // local frontend (Vite dev server)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

// API routes
app.use('/events', eventsRouter);
app.get('/api/ping', (req, res) => res.send('pong'));
app.use('/api/lock-seats', lockSeatsRouter);
app.use('/api', userDataRoute);
app.use('/api2', paymentRouter);
// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket server
setupWebSocketServer(server);

// Start the server
server.listen(PORT, () => {
  console.log(`✅ Server (HTTP + WS) running on port ${PORT}`);
});