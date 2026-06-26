import { Pool } from 'pg';

// Use DATABASE_URL for PostgreSQL connection (Render provides this automatically)
// Falls back to individual env vars for local development
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize tables
export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        google_id TEXT UNIQUE,
        github_id TEXT UNIQUE,
        clerk_id TEXT UNIQUE,
        is_verified INTEGER DEFAULT 1,
        age INTEGER,
        gender TEXT,
        height REAL,
        weight REAL,
        activity_level TEXT,
        goal TEXT,
        sleep_hours REAL,
        dietary_restrictions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS health_assessments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        bmi REAL,
        bmr REAL,
        tdee REAL,
        category TEXT,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workout_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title TEXT,
        duration TEXT,
        intensity TEXT,
        exercises TEXT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS nutrition_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        target_calories REAL,
        target_protein REAL,
        meals TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        weight REAL,
        bmi REAL,
        workout_completed INTEGER DEFAULT 0,
        date DATE DEFAULT CURRENT_DATE,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS google_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id),
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expiry_date BIGINT
      );
    `);
    console.log('[DB] PostgreSQL tables initialized successfully');
  } finally {
    client.release();
  }
}

export default pool;
