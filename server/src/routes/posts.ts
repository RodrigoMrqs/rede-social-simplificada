import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const postsRouter = Router();

postsRouter.use(authMiddleware);

// UC-11 Publicar
postsRouter.post('/', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-12 Excluir post
postsRouter.delete('/:postId', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// Detalhe do post (UC-14)
postsRouter.get('/:postId', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-13 Curtir
postsRouter.post('/:postId/like', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-13 Descurtir
postsRouter.delete('/:postId/like', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-14 Comentar
postsRouter.post('/:postId/comments', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-15 Repostar
postsRouter.post('/:postId/repost', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-23 Editar comentário
postsRouter.patch('/:postId/comments/:commentId', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-24 Excluir comentário
postsRouter.delete('/:postId/comments/:commentId', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});
