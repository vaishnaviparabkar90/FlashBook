import express from 'express';
import pool from '../db.js'; // adjust if your pool is defined elsewhere

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY date');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    console.error('Error fetching event by ID:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Get seats for an event
router.get('/:eventId/seats', async (req, res) => {
  const { eventId } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, seat_number, position_row, position_col, price, status
       FROM seats
       WHERE event_id = $1
       ORDER BY position_row, position_col`,
      [eventId]
    );

    // Group seats by row
    const grouped = {};
    result.rows.forEach(seat => {
      const row = seat.position_row;
      if (!grouped[row]) grouped[row] = [];
      grouped[row].push({
        id: seat.id,
        seat_number: seat.seat_number,
        status: seat.status,
        price: seat.price,
        col: seat.position_col
      });
    });

    res.json({ eventId, seats: grouped });
  } catch (err) {
    console.error('Error fetching seats:', err);
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
});

export default router;
