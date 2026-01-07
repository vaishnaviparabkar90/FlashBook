// server/routes/userData.js
import express from 'express';
import { redisClient } from '../redis.js';
import db from '../db.js';
const router = express.Router();
function getSeatLockKey(eventId, seatNumber) {
  return `seat_lock:${eventId}:${seatNumber}`;
}

router.post('/submit-user-data', async (req, res) => {
  console.log('Received request to submit user data:', req.body);
  const { name, email, phone, seats, eventId, userId } = req.body;

  // 1. Validate request
  if (!name || !email || !phone || !Array.isArray(seats) || !eventId || !userId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  //console.log('stage 1 User data:');

  try {
    // 2. Check Redis locks (based on seatNumber)
    console.log('Checking Redis locks for seats:', seats);
    for (const seatNumber of seats) {
      console.log('Checking lock for seat:', seatNumber);
      const lockKey = getSeatLockKey(eventId, seatNumber);
      const lockOwner = await redisClient.get(lockKey);
      if (!lockOwner) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatNumber} is not locked yet. Please lock seats first.`,
        });
      }

      if (lockOwner !== userId) {
        return res.status(403).json({
          success: false,
          message: `Seat ${seatNumber} is locked by another user.`,
        });
      }

      console.log(`Lock for seat ${seatNumber} is valid.`);
    }
    const placeholders = seats.map((_, idx) => `$${idx + 1}`).join(', ');
    const values = [...seats, eventId];
    const eventIdParamIndex = seats.length + 1;

    console.log(`🛠 SQL placeholders: ${placeholders}`);
    console.log(`🛠 Event ID param index: ${eventIdParamIndex}`);
    console.log(`📦 Query values:`, values);
    const seatQuery = `
      SELECT id, seat_number, price
      FROM seats
      WHERE id IN (${placeholders})
        AND event_id = $${eventIdParamIndex}
    `;

    const result = await db.query(seatQuery, values);
    console.log('📊 Query result:', result.rows);

    if (result.rows.length !== seats.length) {
      return res.status(400).json({ success: false, message: 'Some seats not found in database' });
    }
    console.log('All seats found in database.');
    const totalAmount = result.rows.reduce((sum, row) => sum + parseFloat(row.price), 0);
    console.log('Total amount:', totalAmount);
    return res.json({
      success: true,
      totalAmount,
      userId: userId,
      message: `Proceed to payment. Amount: ₹${totalAmount}`,
    });

  } catch (err) {
    console.error('❌ Error in confirm-booking:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
export default router;
