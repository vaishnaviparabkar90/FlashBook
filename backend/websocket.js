import { WebSocketServer, WebSocket } from 'ws';

export const clients = new Map(); // ws -> { userId, eventId }
export let wss;

export function setupWebSocketServer(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('✅ New WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        const { type, eventId, userId } = data;

        /* ---------------- JOIN EVENT ---------------- */
        if (type === 'join_event') {
          clients.set(ws, { userId, eventId });
          console.log(`👤 User ${userId} joined event ${eventId}`);
        }

      } catch (err) {
        console.error('❗ Invalid WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      const info = clients.get(ws);
      if (info) {
        console.log(`❎ User ${info.userId} disconnected from event ${info.eventId}`);
      }
      clients.delete(ws);
    });
  });

  console.log('🚀 WebSocket server attached to HTTP server');
  return wss;
}

/* --------------------------------------------------
   Helper function to broadcast seat updates
   Call this FROM YOUR HTTP ROUTES
-------------------------------------------------- */
export function broadcastSeatUpdate({ eventId, seatId, action, userId }) {
  if (!wss) return;

  console.log(
    `📢 Broadcasting seat update → Event:${eventId}, Seat:${seatId}, Action:${action}`
  );

  wss.clients.forEach((client) => {
    const info = clients.get(client);

    if (
      client.readyState === WebSocket.OPEN &&
      info?.eventId === eventId
    ) {
      client.send(JSON.stringify({
        type: 'seat_update',
        eventId,
        seatId,
        action,     // "locked" | "unlocked" | "booked"
        userId,
      }));
    }
  });
}
