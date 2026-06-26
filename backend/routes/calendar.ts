import express from 'express';
import { google } from 'googleapis';
import pool from '../database/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { env, isGoogleCalendarConfigured } from '../config/env.js';

const router = express.Router();

const ensureGoogleCalendarConfig: express.RequestHandler = (_req, res, next) => {
  if (!isGoogleCalendarConfigured()) {
    return res.status(503).json({
      error: 'Google Calendar integration is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
    });
  }
  next();
};

const getOAuthClient = () => {
  return new google.auth.OAuth2(
    env.integrations.googleClientId,
    env.integrations.googleClientSecret,
    `${env.appUrl}/api/calendar/auth/callback`
  );
};

router.get('/auth/url', authenticateToken, ensureGoogleCalendarConfig, (req, res) => {
  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    state: (req as any).user.userId.toString(),
    prompt: 'consent'
  });
  res.json({ url });
});

router.get('/auth/callback', ensureGoogleCalendarConfig, async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send("Missing code or state");

  const userId = parseInt(state as string);
  const oauth2Client = getOAuthClient();

  try {
    const { tokens } = await oauth2Client.getToken(code as string);

    await pool.query(`
      INSERT INTO google_tokens (user_id, access_token, refresh_token, expiry_date)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(user_id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, google_tokens.refresh_token),
        expiry_date = EXCLUDED.expiry_date
    `, [userId, tokens.access_token, tokens.refresh_token, tokens.expiry_date]);

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'CALENDAR_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Calendar connected successfully! Closing window...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Calendar OAuth Error:", error);
    res.status(500).send("Failed to connect calendar");
  }
});

router.get('/events', authenticateToken, ensureGoogleCalendarConfig, async (req, res) => {
  const userId = (req as any).user.userId;
  const result = await pool.query('SELECT * FROM google_tokens WHERE user_id = $1', [userId]);
  const tokenData = result.rows[0];

  if (!tokenData) {
    return res.status(401).json({ error: "Calendar not connected" });
  }

  const auth = getOAuthClient();
  auth.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: tokenData.expiry_date
  });

  if (tokenData.expiry_date && Date.now() > tokenData.expiry_date && tokenData.refresh_token) {
    try {
      const { credentials } = await auth.refreshAccessToken();
      await pool.query(
        'UPDATE google_tokens SET access_token = $1, expiry_date = $2 WHERE user_id = $3',
        [credentials.access_token, credentials.expiry_date, userId]
      );
      auth.setCredentials(credentials);
    } catch (refreshError) {
      console.error("Token refresh error:", refreshError);
      return res.status(401).json({ error: "Session expired, please reconnect calendar" });
    }
  }

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    res.json(response.data.items);
  } catch (error) {
    console.error("Fetch Events Error:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

export default router;
