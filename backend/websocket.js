import { WebSocketServer, WebSocket } from 'ws';
export const clients = new Map();
export const selectedSeatsByEvent = new Map();
export let wss; // export the shared instance
export function setupWebSocketServer(server) {
  wss = new WebSocketServer({ server }); // ✅ overwrite exported `wss`

  wss.on('connection', (ws) => {
    console.log('✅ New client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        const { type, eventId, seatId, userId, action } = data;

        if (type === 'join_event') {
          console.log(`👤 User ${userId} joined event ${eventId}`);
          clients.set(ws, { userId, eventId });

          console.log('📋 Current connected clients:');
          clients.forEach((value) => {
            console.log(`🧑‍💻 User: ${value.userId}, Event: ${value.eventId}`);
          });
        }
      } catch (err) {
        console.error('❗ Invalid message received:', err);
      }
    });

    ws.on('close', () => {
      const clientInfo = clients.get(ws);
      if (!clientInfo) return;

      const { userId, eventId } = clientInfo;
      //console.log(`❎ Connection closed for User ${userId} in Event ${eventId}`);
      clients.delete(ws);

      const eventSeats = selectedSeatsByEvent.get(eventId);
      if (eventSeats) {
        const releasedSeats = [];
        for (const [seatId, uid] of eventSeats.entries()) {
          if (uid === userId) {
            releasedSeats.push(seatId);
            eventSeats.delete(seatId);
            console.log(`↩️ Released seat ${seatId} from User ${userId}`);
          }
        }

        // 🔁 Notify other clients in the same event
        wss.clients.forEach((client) => {
          const clientInfo = clients.get(client);
          if (
            client !== ws &&
            client.readyState === WebSocket.OPEN &&
            clientInfo?.eventId === eventId
          ) {
            releasedSeats.forEach((seatId) => {
              client.send(JSON.stringify({
                type: 'seat_update',
                seatId,
                userId,
                eventId,
                action: 'deselect',
              }));
              console.log(`📤 Sent seat ${seatId} release to User ${clientInfo.userId}`);
            });
          }
        });
      }
    });
  });

  console.log(`🚀 WebSocket server attached to HTTP server`);
  return wss;
}


