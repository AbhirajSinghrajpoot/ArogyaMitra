import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Routes
// import authRoutes from './routes/auth.js'; // Removed for Clerk
import userRoutes from './routes/users.js';
import healthRoutes from './routes/health.js';
import workoutRoutes from './routes/workout.js';
import nutritionRoutes from './routes/nutrition.js';
import coachRoutes from './routes/coach.js';
import progressRoutes from './routes/progress.js';
import discoverRoutes from './routes/discover.js';
// import googleRoutes from './routes/google.js'; // Removed for Clerk
import calendarRoutes from './routes/calendar.js';
import { env, validateEnvironment } from './config/env.js';
import { initDB } from './database/database.js';

import { clerkMiddleware } from '@clerk/express';

// Middleware
import { authenticateToken } from './middleware/auth.js';

// ─── Environment Validation ───────────────────────────────────────────────────
try {
  validateEnvironment();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// Strict limiter for auth routes — prevents brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 20,                       // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: { error: 'Too many requests, please try again later.' }
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: { error: 'Too many requests, please try again later.' }
});

// AI endpoints rate limiter — Groq API calls are expensive
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,           // 1 minute
  max: 10,                       // 10 AI requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: { error: 'AI request limit reached. Please wait a moment.' }
});

// ─── CORS Configuration ───────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  ...(env.appUrl ? [env.appUrl] : [])
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, SSR, etc.)
    if (!origin) return callback(null, true);

    // Automatically allow Render domains in case APP_URL is not set
    if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}`);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

async function startServer() {
  const app = express();
  const PORT = env.port;

  // ─── Initialize Database ───────────────────────────────────────────────────
  await initDB();

  // ─── Security Headers (Helmet) ─────────────────────────────────────────────
  // Step 4: CSP must explicitly allow YouTube frame-src, otherwise Error 153 occurs
  const appUrl = env.appUrl || '';
  const helmetConfig = {
    // ✅ ROOT CAUSE FIX: helmet defaults to "no-referrer" which strips the Referer header.
    // YouTube embed player requires the Referer header to verify the embedder identity.
    // Without it, YouTube responds with Error 153 (embedder.identity.missing.referrer).
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
    contentSecurityPolicy: false,
  };

  if (process.env.NODE_ENV === 'production') {
    app.use(helmet(helmetConfig));
  } else {
    // In dev, relax CSP so Vite HMR works but still allow YouTube
    app.use(helmet({ ...helmetConfig, contentSecurityPolicy: false }));
  }

  // ─── Core Middleware ───────────────────────────────────────────────────────
  app.use(clerkMiddleware());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '2mb' }));           // Was 50mb — no endpoint needs that
  app.use(express.urlencoded({ limit: '2mb', extended: true }));

  // Apply general rate limiter to all API routes
  app.use('/api', apiLimiter);

  // ─── Request Logger ────────────────────────────────────────────────────────
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // ─── API Routes ────────────────────────────────────────────────────────────
  app.use('/api/users', authenticateToken, userRoutes);
  app.use('/api/health', authenticateToken, healthRoutes);
  app.use('/api/workout', authenticateToken, workoutRoutes);
  app.use('/api/nutrition', authenticateToken, nutritionRoutes);
  app.use('/api/coach', authenticateToken, coachRoutes);
  app.use('/api/progress', authenticateToken, progressRoutes);
  app.use('/api/discover', authenticateToken, discoverRoutes);
  // app.use('/api/auth', authLimiter, authRoutes); // Removed: Migrated to Clerk
  // app.use('/api/google', googleRoutes); // Removed: Migrated to Clerk
  app.use('/api/calendar', calendarRoutes);

  // ─── Health Check ─────────────────────────────────────────────────────────
  app.get('/api/health-check', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── Frontend Global CSP For Vite ─────────────────────────────────────────
  // Vite in middlewareMode pushes incredibly strict CSP defaults which breaks Clerk.
  // We use a global override here so the Dev Server respects our domains.
  app.use((_req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://challenges.cloudflare.com; connect-src 'self' http://localhost:* ws://localhost:* https://www.googleapis.com https://*.clerk.accounts.dev https://clerk.com https://api.clerk.com https://*.clerk.com https://challenges.cloudflare.com wss://ws-us2.pusher.com; worker-src 'self' blob:; img-src 'self' data: blob: https://images.unsplash.com https://img.youtube.com https://i.ytimg.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://www.gstatic.com https://developers.google.com https://img.clerk.com https://*.clerk.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.com; font-src 'self' https://fonts.gstatic.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com;"
    );
    next();
  });

  // ─── Frontend ─────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: path.resolve(__dirname, '../frontend'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, Vite builds to /frontend/dist relative to the project root
    // Use process.cwd() so it works correctly on Render (/opt/render/project/src)
    const distPath = path.join(process.cwd(), 'frontend', 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) =>
      res.sendFile(path.join(distPath, 'index.html'))
    );
  }

  // ─── Global Error Handler ──────────────────────────────────────────────────
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ArogyaMitra running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
