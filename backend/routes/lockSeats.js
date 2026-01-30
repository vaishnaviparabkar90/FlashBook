import express from 'express';
import { redisClient } from '../redis.js';
import db from '../db.js';
import { broadcastSeatUpdate } from '../websocket.js';

const router = express.Router();

const LOCK_EXPIRY = 5 * 60; // 5 minutes

/* ------------------ Seat Lock Route ------------------ */
router.post('/', async (req, res) => {
  const { eventId, userId, selectedSeats } = req.body;

  console.log('\n📥 Received lock request:', { eventId, userId, selectedSeats });

  if (!eventId || !userId || !Array.isArray(selectedSeats)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
    });
  }

  try {
    /* ---------------- STEP 1: DB CHECK ---------------- */
    console.log('🔎 Checking DB for already booked seats');

    const placeholders = selectedSeats.map((_, i) => `$${i + 1}`).join(', ');
    const result = await db.query(
      `SELECT id FROM seats WHERE id IN (${placeholders}) AND status = 'booked'`,
      selectedSeats
    );

    if (result.rows.length > 0) {
      return res.json({
        success: false,
        message: 'Some seats are already booked',
        bookedSeats: result.rows.map(r => r.id),
      });
    }

    /* ---------------- STEP 2: REDIS LOCK ---------------- */
    console.log('🔒 Locking seats in Redis');

    for (const seatId of selectedSeats) {
      const lockKey = `seat_lock:${eventId}:${seatId}`;

      const expiresAt = Date.now() + LOCK_EXPIRY * 1000;

      const lockResult = await redisClient.set(
        lockKey,
        JSON.stringify({ userId, expiresAt }),
        'NX',
        'EX',
        LOCK_EXPIRY
      );

      if (!lockResult) {
        return res.json({
          success: false,
          message: `Seat ${seatId} is already being booked`,
        });
      }

      console.log(`✅ Seat ${seatId} locked`);

      broadcastSeatUpdate({
        eventId,
        seatId,
        action: 'locked',
        userId,
      });
    }

    return res.json({
      success: true,
      message: 'Seats locked successfully',
      lockExpirySeconds: LOCK_EXPIRY,
    });

  } catch (err) {
    console.error('❌ Error locking seats:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
