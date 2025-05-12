import express from 'express';
import http from 'http';
import cors from 'cors';
import { createClient } from 'redis';  // Redis Client
import pool from './db.js';
import eventsRouter from './routes/events.js';
import { setupWebSocketServer} from './websocket.js';
const app = express();
const PORT = process.env.PORT || 3000;
// Set up Redis client
const redisClient = createClient({
  username: 'default',
  password: 'fkwvq6VxveV2HdII5wsaQOZBa0voiqrN',
  socket: {
      host: 'redis-18122.c99.us-east-1-4.ec2.redns.redis-cloud.com',
      port: 18122
  }
});


redisClient.on('error', (err) => console.log('Redis Client Error', err));

async function connectRedis() {
  await redisClient.connect();
}

connectRedis();

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
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connected!', timestamp: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket server
setupWebSocketServer(server);

// Start the server
server.listen(PORT, () => {
  console.log(`✅ Server (HTTP + WS) running on port ${PORT}`);
});