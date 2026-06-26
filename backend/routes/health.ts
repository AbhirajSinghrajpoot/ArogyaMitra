import express from 'express';
import { calculateHealthStats } from '../services/healthLogic.js';
import pool from '../database/database.js';
import { getHealthInsight } from '../services/aiService.js';

const router = express.Router();

router.post('/calc', async (req, res) => {
  const { profile, userId } = req.body;

  if (!profile) {
    return res.status(400).json({ error: "Profile data is required" });
  }

  try {
    const stats = calculateHealthStats(profile);

    if (userId) {
      await pool.query(`
        INSERT INTO health_assessments (user_id, bmi, bmr, tdee, category)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, stats.bmi, stats.bmr, stats.tdee, stats.category]);
    }

    res.json(stats);
  } catch (error) {
    console.error("Health calculation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post('/insight', async (req, res) => {
  const { profile, stats } = req.body;

  if (!profile || !stats) {
    return res.status(400).json({ error: "Profile and stats are required" });
  }

  try {
    const insight = await getHealthInsight({ profile, stats });
    res.json({ insight });
  } catch (error) {
    console.error("Health insight error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
