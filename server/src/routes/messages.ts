import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const messagesRouter = Router();

messagesRouter.use(authMiddleware);

// UC-26 Listar conversas do usuário autenticado
messagesRouter.get('/', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-25 Iniciar conversa ou buscar existente com outro usuário
messagesRouter.post('/', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-27 Listar mensagens de uma conversa (paginado)
messagesRouter.get('/:conversationId', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-25 Enviar mensagem em uma conversa existente
messagesRouter.post('/:conversationId', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-28 Excluir mensagem (soft delete pelo remetente)
messagesRouter.delete('/:conversationId/:messageId', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});
