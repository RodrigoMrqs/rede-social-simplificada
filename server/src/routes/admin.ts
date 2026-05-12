import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware, AdminRequest } from '../middleware/adminAuth';

export const adminRouter = Router();

adminRouter.use(authMiddleware, adminMiddleware);

// UC-19 Painel / UC-22 Métricas
adminRouter.get('/metrics', async (_req: AdminRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-20 Moderar post
adminRouter.post('/posts/:postId/hide', async (_req: AdminRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

adminRouter.post('/posts/:postId/restore', async (_req: AdminRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

adminRouter.delete('/posts/:postId', async (_req: AdminRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-21 Suspender / banir usuário
adminRouter.post('/users/:userId/sanction', async (_req: AdminRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

adminRouter.post('/users/:userId/sanction/:sanctionId/revoke', async (_req: AdminRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});
