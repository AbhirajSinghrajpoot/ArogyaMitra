import { Request, Response, NextFunction } from 'express';
import { requireAuth, clerkClient, getAuth } from '@clerk/express';
import pool from '../database/database.js';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log(`\n--- NEW REQUEST to ${req.path} ---`);

  requireAuth()(req, res, async (err: any) => {
    if (err) {
      console.log("-> 401: Clerk Auth Failed", err);
      return res.status(401).json({ error: 'Access denied. Invalid or missing token.' });
    }

    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      console.log("-> 401: No userId found via getAuth(req)");
      return res.status(401).json({ error: 'Access denied. Unauthenticated request.' });
    }

    try {
      // 1. Check if user already exists in our DB via clerk_id
      let userResult = await pool.query('SELECT id, email FROM users WHERE clerk_id = $1', [clerkId]);
      let userRow = userResult.rows[0];

      if (!userRow) {
        // 2. Fetch user from Clerk to get email
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const name = clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : 'User';

        // 3. Check if email already exists (old auth system)
        const existingResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        const existingUser = existingResult.rows[0];

        if (existingUser) {
          // Link Clerk ID to old account
          await pool.query('UPDATE users SET clerk_id = $1 WHERE id = $2', [clerkId, existingUser.id]);
          userRow = { id: existingUser.id, email };
        } else {
          // Create brand new user
          const insertResult = await pool.query(
            'INSERT INTO users (name, email, clerk_id) VALUES ($1, $2, $3) RETURNING id',
            [name, email, clerkId]
          );
          userRow = { id: insertResult.rows[0].id, email };
        }
      }

      // 4. Attach DB integer ID to req.user
      req.user = { userId: userRow.id, email: userRow.email };
      console.log(`-> Clerk Token verified for DB user: ${userRow.id} (Clerk ID: ${clerkId})`);
      next();

    } catch (dbError) {
      console.error(`-> 500 DB or Clerk API Error:`, dbError);
      return res.status(500).json({ error: `Internal Server Error validating user` });
    }
  });
};
