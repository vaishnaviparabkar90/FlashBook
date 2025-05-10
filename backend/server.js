import express from 'express';
import http from 'http'; // ✅ Required to create raw HTTP server
import cors from 'cors';
import pool from './db.js';
import eventsRouter from './routes/events.js';
import { setupWebSocketServer } from './websocket.js';

const app = express();
const PORT = process.env.PORT || 3000; // ✅ Use dynamic port for Render

app.use(express.json());
const allowedOrigins = [
  'https://flashboook.netlify.app',   // production frontend
  'http://localhost:5173'             // local frontend (Vite dev server)
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
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connected!', timestamp: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ✅ Create one server for both HTTP and WebSocket
const server = http.createServer(app);

// ✅ Pass the shared server to your WebSocket setup
setupWebSocketServer(server);

// ✅ Listen once for both Express and WebSocket
server.listen(PORT, () => {
  console.log(`✅ Server (HTTP + WS) running on port ${PORT}`);
});
