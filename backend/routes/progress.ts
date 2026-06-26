import express from 'express';
import pool from '../database/database.js';

const router = express.Router();

// Get progress history for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM progress WHERE user_id = $1 ORDER BY date ASC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress data' });
  }
});

// Add new progress entry
router.post('/', async (req: any, res) => {
  const userId = req.user.userId;
  const { weight, bmi, workout_completed, notes } = req.body;

  if (!weight) {
    return res.status(400).json({ error: 'Weight is required' });
  }

  try {
    await pool.query(`
      INSERT INTO progress (user_id, weight, bmi, workout_completed, notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, weight, bmi, workout_completed ? 1 : 0, notes]);

    res.status(201).json({ message: 'Progress recorded successfully' });
  } catch (error) {
    console.error('Error recording progress:', error);
    res.status(500).json({ error: 'Failed to record progress' });
  }
});

export default router;
