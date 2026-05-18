import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

// UC-17 Listar notificações
notificationsRouter.get('/', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// Badge de não-lidas
notificationsRouter.get('/unread-count', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// Marcar tudo como lido
notificationsRouter.post('/read-all', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-06 Ler preferências de notificação
notificationsRouter.get('/preferences', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-06 Atualizar preferências de notificação
notificationsRouter.patch('/preferences', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});
