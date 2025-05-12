import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from 'redis';

export const clients = new Map();
export const selectedSeatsByEvent = new Map();
export let wss; // export the shared instance

const redisClient = createClient({
  username: 'default',
  password: 'fkwvq6VxveV2HdII5wsaQOZBa0voiqrN',
  socket: {
    host: 'redis-18122.c99.us-east-1-4.ec2.redns.redis-cloud.com',
    port: 18122,
  },
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
await redisClient.connect();

if (!clients) {
  console.log('❌ Error: clients map is not initialized');
}
//await redisClient.flushDb();
//console.log("🚿 Redis flushed — all seat bookings cleared");

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

        if (type === 'seat_selection') {
          console.log(`🎯 Seat ${seatId} (${action}) by User ${userId} in Event ${eventId}`);

          // Queue the event
          const queueItem = JSON.stringify({ seatId, userId, eventId, action });
          redisClient.rPush('seatSelectionQueue', queueItem);

          ws.send(JSON.stringify({
            type: 'seat_processing',
        seatId,
        eventId,
        userId
      }));  
        }
      } catch (err) {
        console.error('❗ Invalid message received:', err);
      }
    });

    ws.on('close', () => {
      const clientInfo = clients.get(ws);
      if (!clientInfo) return;

      const { userId, eventId } = clientInfo;
      console.log(`❎ Connection closed for User ${userId} in Event ${eventId}`);
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

async function processSeatQueue() {
  while (true) {
    const queueItem = await redisClient.lPop('seatSelectionQueue');

    if (queueItem) {
      const { seatId, userId, eventId, action } = JSON.parse(queueItem);
      const redisSeatsKey = `event:${eventId}:seats`;
      const lockKey = `lock:event:${eventId}:seat:${seatId}`;

      if (action === 'select') {
        // Try to acquire lock
        const lockSet = await redisClient.set(lockKey, userId, {
          NX: true,
          EX: 120,   
        });

        if (!lockSet) {
          console.log(`⛔ Seat ${seatId} is already under booking`);
          broadcastSeatUpdate(seatId, null, eventId, 'already_under_booking');
          continue;
        }

        // Check if seat is already taken
        await redisClient.watch(redisSeatsKey);
        const currentSeatMap = await redisClient.hGetAll(redisSeatsKey);

        if (!currentSeatMap[seatId]) {
          const tx = redisClient.multi();
          tx.hSet(redisSeatsKey, seatId, userId);
          const result = await tx.exec();

          if (result) {
            console.log(`✅ Seat ${seatId} successfully booked by ${userId}`);
            broadcastSeatUpdate(seatId, userId, eventId, 'booked');
          } else {
            console.log(`🚫 Seat ${seatId} booking failed due to race`);
            broadcastSeatUpdate(seatId, null, eventId, 'booking_failed');
          }
        } else {
          console.log(`🚫 Seat ${seatId} is already booked by ${currentSeatMap[seatId]}`);
          broadcastSeatUpdate(seatId, currentSeatMap[seatId], eventId, 'already_booked');
        }

        await redisClient.unwatch();
        await redisClient.del(lockKey); // Remove the lock once done

      } else if (action === 'deselect') {
        await redisClient.hDel(redisSeatsKey, seatId);
        console.log(`❌ Seat ${seatId} deselected by ${userId}`);
        broadcastSeatUpdate(seatId, userId, eventId, 'deselected');
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100)); // throttle
  }
}


// Start the worker to process the queue
processSeatQueue();

// Broadcast the seat update to clients
function broadcastSeatUpdate(seatId, userId, eventId, action) {
  const message = JSON.stringify({
    type: 'seat_update',
    seatId,
    userId,
    eventId,
    action
  });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
