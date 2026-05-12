import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

// UC-01 Cadastro
authRouter.post('/register', async (_req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-02 Login
authRouter.post('/login', async (_req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-03 Logout
authRouter.post('/logout', authMiddleware, async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});
