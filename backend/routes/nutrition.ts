import express from 'express';
import { calculateHealthStats } from '../services/healthLogic.js';
import { generateNutritionPlanAI, analyzeFoodMacroAI } from '../services/aiService.js';
import pool from '../database/database.js';

const router = express.Router();

router.post('/plan', async (req, res) => {
  const { profile, userId } = req.body;

  if (!profile) {
    return res.status(400).json({ error: "Profile data is required" });
  }

  try {
    const stats = calculateHealthStats(profile);

    let targetCalories = stats.tdee;
    if (profile.goals === 'fat_loss') targetCalories -= 300;
    else if (profile.goals === 'muscle_gain') targetCalories += 300;

    const targetProtein = profile.weight * 1.8;

    const plan = await generateNutritionPlanAI({
      targetCalories,
      targetProtein,
      dietaryRestrictions: profile.dietaryRestrictions
    });

    if (userId) {
      await pool.query(`
        INSERT INTO nutrition_plans (user_id, target_calories, target_protein, meals)
        VALUES ($1, $2, $3, $4)
      `, [userId, targetCalories, targetProtein, JSON.stringify(plan)]);
    }

    res.json({ ...plan, targetCalories, targetProtein });
  } catch (error) {
    console.error("Nutrition plan error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post('/macro', async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: "Valid food query is required" });
  }

  try {
    const macroData = await analyzeFoodMacroAI(query);
    res.json(macroData);
  } catch (error) {
    console.error("Macro search error:", error);
    res.status(500).json({ error: "Failed to analyze food" });
  }
});

export default router;
