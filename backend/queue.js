// queue.js
import { Queue } from 'bullmq';
import { redisConfig } from './redis.js';

export const seatLockQueue = new Queue('seat-lock-queue', {
  connection: redisConfig,
});

export const seatLockQueueReady = seatLockQueue.waitUntilReady().then(() => {
  console.log('✅ Seat Lock Queue is ready to process jobs');
}).catch((error) => {
  console.error('❌ Error with the Seat Lock Queue:', error);
  throw error;
});

