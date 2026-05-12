import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const usersRouter = Router();

usersRouter.use(authMiddleware);

// UC-04 Visualizar perfil
usersRouter.get('/:userId', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-05 Editar perfil
usersRouter.patch('/me', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-07 Excluir conta
usersRouter.delete('/me', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-08 Seguir
usersRouter.post('/:userId/follow', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-09 Deixar de seguir
usersRouter.delete('/:userId/follow', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-10 Listar seguidores
usersRouter.get('/:userId/followers', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-10 Listar seguindo
usersRouter.get('/:userId/following', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-18 Busca de usuários
usersRouter.get('/search/users', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});
