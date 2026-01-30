import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import Razorpay from 'razorpay';
import { redisClient } from '../redis.js';
import db from '../db.js'; // Assuming pg-pool instance
const router = express.Router();
import { broadcastSeatUpdate } from '../websocket.js';


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function getSeatLockKey(eventId, seatId) {
  return `seat_lock:${eventId}:${seatId}`;
}

// Create order route
router.post('/create-order', async (req, res) => {
  const { amount } = req.body;
  if (!amount) return res.status(400).json({ error: 'Amount is required' });

  const options = {
    amount: amount * 100,
    currency: 'INR',
    receipt: `receipt_order_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// Finalize payment route
router.post('/finalize-payment', async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    seats,
    eventId,
    userId,
    name,
    email,
    phone,
    amount,
  } = req.body;

  if (
    !razorpay_payment_id || !razorpay_order_id || !razorpay_signature ||
    !Array.isArray(seats) || seats.length === 0 ||
    !eventId || !userId || !name || !email || !phone || !amount
  ) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Verify Razorpay signature
  const crypto = await import('crypto');
  const expectedSig = crypto
    .createHmac('sha256', razorpay.key_secret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Validate Redis locks for all seats
    for (const seatId of seats) {
      const lockKey = getSeatLockKey(eventId, seatId);
      const lockValue = await redisClient.get(lockKey);
      if (!lockValue) {
        return res.status(403).json({ success: false, message: 'Seat lock expired' });
      }

      const { userId: lockUser } = JSON.parse(lockValue);
      if (lockUser !== userId) {
        return res.status(403).json({ success: false, message: 'Seat not locked by you' });
      }

    }

    // 1. Update seat status to 'booked'
    const placeholders = seats.map((_, i) => `$${i + 1}`).join(', ');
    await client.query(
      `UPDATE seats SET status = 'booked' WHERE id IN (${placeholders})`,
      seats
    );

    // 2. Insert into booking table
    const bookingIds = [];
    for (const seatId of seats) {
      const insertBooking = await client.query(
        `INSERT INTO booking (user_id, event_id, seat_id, name, email, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [userId, eventId, seatId, name, email, phone]
      );
      bookingIds.push(insertBooking.rows[0].id);
    }

    // 3. Insert into payment table (one record per booking or one total — here one total)
    await client.query(
      `INSERT INTO payment (booking_id, razorpay_payment_id, razorpay_order_id, amount)
       VALUES ($1, $2, $3, $4)`,
      [bookingIds[0], razorpay_payment_id, razorpay_order_id, amount]
    );
    for (const seatId of seats) {
      broadcastSeatUpdate({
        eventId,
        seatId,
        action: 'booked',
        userId,
      });
    }

    // 4. Delete Redis locks
    const lockKeys = seats.map(seatId => getSeatLockKey(eventId, seatId));
    await redisClient.del(lockKeys);

    await client.query('COMMIT');

    return res.json({ success: true, message: 'Payment verified and booking finalized' });


  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error finalizing booking:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
