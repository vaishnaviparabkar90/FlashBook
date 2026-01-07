import express from 'express';
import { redisClient } from '../redis.js'; // ioredis client
import { seatLockQueue, seatLockQueueReady } from '../queue.js';
import db from '../db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { eventId, userId, selectedSeats } = req.body;

  console.log('📥 Received lock request:', { eventId, userId, selectedSeats });

  if (!eventId || !userId || !Array.isArray(selectedSeats)) {
    console.warn('⚠️ Invalid request payload');
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }

  try {
    // Step 1: Check for already booked seats in DB
    const placeholders = selectedSeats.map((_, i) => `$${i + 1}`).join(', ');
    console.log('🔎 Running SQL query to check booked seats...');
    const result = await db.query(
      `SELECT id FROM seats WHERE id IN (${placeholders}) AND status = 'booked'`,
      selectedSeats
    );
    console.log('🔎 SQL Query Result:', result.rows);

    if (result.rows.length > 0) {
      console.warn('❌ Some seats already booked:', result.rows);
      return res.status(200).json({
        success: false,
        message: 'Some seats are already booked',
        bookedSeats: result.rows.map(r => r.id),
      });
    }

    // Step 2: Check Redis for locks
    const lockedSeats = [];
    for (const seatId of selectedSeats) {
      const lockKey = `seat_lock:${eventId}:${seatId}`;
      const existing = await redisClient.get(lockKey); // ioredis get
      console.log(`🔐 Checking Redis for lock: ${lockKey} → ${existing}`);

      if (existing && existing !== userId) {
        lockedSeats.push(seatId);
      }
    }

    if (lockedSeats.length > 0) {
      console.warn('⚠️ Some seats are already being booked by others:', lockedSeats);
      return res.status(200).json({
        success: false,
        message: 'Some seats are already being booked',
        lockedSeats,
      });
    }

    // Step 3: Add to BullMQ queue
    console.log('📤 Preparing to queue the lock job...');

    await seatLockQueueReady; // Ensure the queue is ready
    console.log('📤 Queue is ready to accept jobs');

    try {
      const job = await seatLockQueue.add('lock-seats', {
        eventId,
        userId,
        selectedSeats,
      });

      console.log('📤 Job created with ID:', job.id);
      // Log job status
      const jobCount = await seatLockQueue.getJobCounts();
      console.log('📊 Current job counts in the queue:', jobCount);

      res.status(200).json({ success: true, message: 'Seats are being locked' });

    } catch (error) {
      console.error('❌ Error adding job to queue:', error);
      res.status(500).json({ success: false, message: 'Internal server error while adding job to queue' });
    }

  } catch (err) {
    console.error('❌ Error in seat locking route:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
