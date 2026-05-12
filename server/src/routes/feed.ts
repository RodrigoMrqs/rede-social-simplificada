import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const feedRouter = Router();

feedRouter.use(authMiddleware);

// UC-16 Feed
feedRouter.get('/', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});
