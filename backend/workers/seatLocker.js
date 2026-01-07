import { Worker } from 'bullmq';
import { redisClient, redisConfig } from '../redis.js';

console.log('🚀 Worker file started');

const lockExpiry = 5 * 60 ; // 5 minutes
console.log(`⏳ Lock expiry set to ${lockExpiry} seconds`);

const seatLockWorker = new Worker(
  'seat-lock-queue',
  async (job) => {
    console.log(`🔧 Processing job ${job.id}...`);
    const { eventId, userId, selectedSeats } = job.data;
    console.log(`🔧 Locking seats for user ${userId} | Event: ${eventId}`);
    console.log(`🪑 Seats: ${selectedSeats.join(', ')}`);

    for (const seatId of selectedSeats) {
      const lockKey = `seat_lock:${eventId}:${seatId}`;
      try {
        // Use the existing redisClient here
        const result = await redisClient.set(lockKey, userId, 'EX', lockExpiry, 'NX');

        if (result === null) {
          console.log(`⚠️ Seat ${seatId} already locked — skipping.`);
        } else {
          console.log(`🔒 Seat ${seatId} locked for user ${userId}`);
        }
      } catch (error) {
        console.error(`❌ Error locking seat ${seatId}:`, error);
      }
    }
setTimeout(async () => {
  const testKey = `seat_lock:${eventId}:${selectedSeats[0]}`;
  const val = await redisClient.get(testKey);
  console.log(`🧪 After 5 mins, lock value for first seat:`, val); // should be null
}, 15 * 60 * 1000 + 5000); // 5 mins + buffer

    console.log(`✅ Completed job ${job.id} for user ${userId}`);
  },
  
 // Use the existing Redis URL from redisClient
  {
    connection: redisConfig, // 👈 Use same config as queue
  }
);

// Add event listeners for worker status

seatLockWorker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

// Handle unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (err) => {
  console.error('❗ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❗ Uncaught Exception:', err);
  process.exit(1);
});
