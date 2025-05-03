import { WebSocketServer } from 'ws';

const clients = new Map();
const selectedSeatsByEvent = new Map();

export function setupWebSocketServer(port) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
      try {
        console.log('Message received:', message.toString());

        const data = JSON.parse(message);
        const { type, eventId, seatId, userId, action } = data;

        if (type === 'join_event') {
          console.log(` User ${userId} joined event ${eventId}`);
          clients.set(ws, { userId, eventId });
        }

        if (type === 'seat_selection') {
          console.log(`Seat ${seatId} - Action: ${action} by User: ${userId} in Event: ${eventId}`);

          if (!selectedSeatsByEvent.has(eventId)) {
            selectedSeatsByEvent.set(eventId, new Map());
          }

          const eventSeats = selectedSeatsByEvent.get(eventId);

          if (action === 'select') {
            eventSeats.set(seatId, userId);
            console.log(`✅ Seat ${seatId} selected by ${userId}`);
          } else if (action === 'deselect') {
            eventSeats.delete(seatId);
            console.log(`❌ Seat ${seatId} deselected by ${userId}`);
          }

          // Broadcast seat update
          wss.clients.forEach((client) => {
            const clientInfo = clients.get(client);
            if (
                client !== ws &&
                client.readyState === ws.OPEN &&
                clientInfo?.eventId === eventId
              )
               {
              client.send(JSON.stringify({
                type: 'seat_update',
                seatId,
                userId,
                eventId,
                action,
              }));
              console.log(`📡 Broadcasted seat ${seatId} update to user ${clientInfo.userId}`);
            }
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
      console.log(`❎ Connection closed for user ${userId} in event ${eventId}`);

      const eventSeats = selectedSeatsByEvent.get(eventId);
      if (eventSeats) {
        const releasedSeats = [];
        for (const [seatId, uid] of eventSeats.entries()) {
          if (uid === userId) {
            releasedSeats.push(seatId);
            eventSeats.delete(seatId);
            console.log(`↩️ Released seat ${seatId} from user ${userId}`);
          }
        }

        // Notify others about released seats
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
              console.log(`📤 Broadcasted seat ${seatId} release to user ${clientInfo.userId}`);
            });
          }
        });
      }

      clients.delete(ws);
    });
  });

  console.log(`✅ WebSocket server running on ws://localhost:${port}`);
}
