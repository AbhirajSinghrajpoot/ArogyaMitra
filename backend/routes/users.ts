import express from 'express';
import pool from '../database/database.js';

const router = express.Router();

// Get Current User Profile
router.get('/profile', async (req: any, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(`
      SELECT id, name, email, age, gender, height, weight,
             activity_level, goal, sleep_hours, dietary_restrictions,
             is_verified, google_id, github_id, created_at
      FROM users WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = result.rows[0];
    // Map DB snake_case → camelCase for frontend UserProfile type
    const profile = {
      ...user,
      activityLevel: user.activity_level,
      goals: user.goal,
      sleepHours: user.sleep_hours,
      dietaryRestrictions: user.dietary_restrictions,
    };
    res.json(profile);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to retrieve profile" });
  }
});

// Update Profile
router.post('/profile', async (req: any, res) => {
  const userId = req.user.userId;
  const { age, gender, height, weight, activityLevel, goals, goal, sleepHours, dietaryRestrictions } = req.body;
  const goalValue = goals ?? goal;

  try {
    await pool.query(`
      UPDATE users
      SET age = $1, gender = $2, height = $3, weight = $4,
          activity_level = $5, goal = $6, sleep_hours = $7, dietary_restrictions = $8
      WHERE id = $9
    `, [age, gender, height, weight, activityLevel, goalValue, sleepHours, dietaryRestrictions, userId]);

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create User
router.post('/', async (req, res) => {
  const { name, email, age, gender, height, weight, activityLevel, goals, sleepHours, dietaryRestrictions } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    const result = await pool.query(`
      INSERT INTO users (name, email, age, gender, height, weight, activity_level, goal, sleep_hours, dietary_restrictions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [name, email, age, gender, height, weight, activityLevel, goals, sleepHours, dietaryRestrictions]);

    res.status(201).json({ id: result.rows[0].id, message: "User created successfully" });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("User creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get User Progress
router.get('/:id/progress', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM progress WHERE user_id = $1 ORDER BY date DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve progress" });
  }
});

export default router;
