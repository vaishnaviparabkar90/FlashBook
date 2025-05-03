import express from 'express';
import cors from 'cors';
import pool from './db.js';
import eventsRouter from './routes/events.js';
import { setupWebSocketServer } from './websocket.js'; // <- External file

const app = express();
const PORT = 3000;
const WS_PORT = 3001;

app.use(express.json());
app.use(cors({
  origin: 'https://flashboook.netlify.app', // your Netlify domain
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

// Start HTTP server
app.listen(PORT, () => {
  console.log(`✅ Express server running on http://localhost:${PORT}`);
});

// Start WebSocket server
setupWebSocketServer(WS_PORT);
