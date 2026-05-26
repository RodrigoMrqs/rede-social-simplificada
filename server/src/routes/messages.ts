import { Router } from 'express';
import { and, asc, desc, eq, isNull, ne, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { conversations, directMessages, users } from '../../../db/schema';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const messagesRouter = Router();

messagesRouter.use(authMiddleware);

function participantOrder(
  userId: string,
  otherId: string,
): { userAId: string; userBId: string } {
  return userId < otherId
    ? { userAId: userId, userBId: otherId }
    : { userAId: otherId, userBId: userId };
}

async function findConversation(conversationId: string, userId: string) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        or(eq(conversations.userAId, userId), eq(conversations.userBId, userId)),
      ),
    )
    .limit(1);
  return conv ?? null;
}

async function findMessage(messageId: string, conversationId: string) {
  const [message] = await db
    .select()
    .from(directMessages)
    .where(
      and(
        eq(directMessages.id, messageId),
        eq(directMessages.conversationId, conversationId),
        isNull(directMessages.deletedAt),
      ),
    )
    .limit(1);
  return message ?? null;
}

const startSchema = z.object({
  recipientId: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

const messageSchema = z.object({ content: z.string().min(1).max(1000) });

// UC-26 Listar conversas do usuário autenticado
messagesRouter.get('/', async (req: AuthRequest, res) => {
  const userId = req.userId!;

  try {
    const convs = await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.userAId, userId), eq(conversations.userBId, userId)))
      .orderBy(desc(conversations.createdAt));

    return res.json(convs);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-25 Enviar mensagem (cria conversa se não existir)
messagesRouter.post('/', async (req: AuthRequest, res) => {
  const parse = startSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parse.error.errors });
  }

  const userId = req.userId!;
  const { recipientId, content } = parse.data;

  if (recipientId === userId) {
    return res.status(422).json({ message: 'Não é possível enviar mensagem para si mesmo' });
  }

  try {
    const [recipient] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, recipientId), isNull(users.deletedAt)))
      .limit(1);

    if (!recipient) return res.status(404).json({ message: 'Usuário não encontrado' });

    const { userAId, userBId } = participantOrder(userId, recipientId);

    const [existing] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userAId, userAId), eq(conversations.userBId, userBId)))
      .limit(1);

    let conversation = existing;
    if (!conversation) {
      const [created] = await db
        .insert(conversations)
        .values({ userAId, userBId })
        .returning();
      conversation = created;
    }

    const [message] = await db
      .insert(directMessages)
      .values({ conversationId: conversation.id, senderId: userId, content })
      .returning();

    return res.status(201).json({ conversation, message });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-27 Ler conversa + marcar mensagens como lidas
messagesRouter.get('/:conversationId', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const conversationId = req.params.conversationId as string;

  try {
    const conv = await findConversation(conversationId, userId);
    if (!conv) return res.status(404).json({ message: 'Conversa não encontrada' });

    const messages = await db
      .select()
      .from(directMessages)
      .where(
        and(eq(directMessages.conversationId, conversationId), isNull(directMessages.deletedAt)),
      )
      .orderBy(asc(directMessages.createdAt));

    await db
      .update(directMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(directMessages.conversationId, conversationId),
          isNull(directMessages.readAt),
          isNull(directMessages.deletedAt),
          ne(directMessages.senderId, userId),
        ),
      );

    return res.json({ conversation: conv, messages });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-25 Enviar mensagem em conversa existente
messagesRouter.post('/:conversationId', async (req: AuthRequest, res) => {
  const parse = messageSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parse.error.errors });
  }

  const userId = req.userId!;
  const conversationId = req.params.conversationId as string;

  try {
    const conv = await findConversation(conversationId, userId);
    if (!conv) return res.status(404).json({ message: 'Conversa não encontrada' });

    const [message] = await db
      .insert(directMessages)
      .values({ conversationId, senderId: userId, content: parse.data.content })
      .returning();

    return res.status(201).json(message);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-27 Editar mensagem (somente remetente)
messagesRouter.patch('/:conversationId/:messageId', async (req: AuthRequest, res) => {
  const parse = messageSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parse.error.errors });
  }

  const userId = req.userId!;
  const { messageId, conversationId } = req.params as Record<string, string>;

  try {
    const message = await findMessage(messageId, conversationId);
    if (!message) return res.status(404).json({ message: 'Mensagem não encontrada' });
    if (message.senderId !== userId) return res.status(403).json({ message: 'Sem permissão' });

    const [updated] = await db
      .update(directMessages)
      .set({ content: parse.data.content })
      .where(eq(directMessages.id, messageId))
      .returning();

    return res.json(updated);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-28 Excluir mensagem (soft delete pelo remetente)
messagesRouter.delete('/:conversationId/:messageId', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { messageId, conversationId } = req.params as Record<string, string>;

  try {
    const message = await findMessage(messageId, conversationId);
    if (!message) return res.status(404).json({ message: 'Mensagem não encontrada' });
    if (message.senderId !== userId) return res.status(403).json({ message: 'Sem permissão' });

    await db
      .update(directMessages)
      .set({ deletedAt: new Date() })
      .where(eq(directMessages.id, messageId));

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});
