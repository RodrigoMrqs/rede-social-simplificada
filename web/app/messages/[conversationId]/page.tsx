'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { messageService } from '@/services/messageService';
import { DirectMessage } from '@/types';

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { session } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.token) {
      router.push('/login');
      return;
    }
    loadMessages();
  }, [conversationId, session?.token, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messageService.getMessages(session!.token, conversationId);
      setMessages(response.items.reverse());
      setCursor(response.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newMessage.trim()) {
      setError('A mensagem não pode estar vazia');
      return;
    }

    setSubmitting(true);
    try {
      const message = await messageService.sendMessage(session!.token, conversationId, newMessage);
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta mensagem?')) return;
    try {
      await messageService.deleteMessage(session!.token, conversationId, messageId);
      setMessages(messages.filter((m) => m.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar mensagem');
    }
  };

  if (!session) return <div>Carregando...</div>;
  if (loading) return <div style={{ padding: '1rem', textAlign: 'center' }}>Carregando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', maxWidth: '600px', margin: '0 auto' }}>
      <button
        onClick={() => router.back()}
        style={{
          background: 'none',
          border: 'none',
          color: '#1da1f2',
          cursor: 'pointer',
          fontSize: '1rem',
          padding: '1rem',
          paddingBottom: '0.5rem',
          textAlign: 'left',
        }}
      >
        ← Voltar
      </button>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            Nenhuma mensagem ainda. Começe a conversa!
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              alignSelf: message.senderId === session.user.id ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
              marginBottom: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: message.senderId === session.user.id ? '#1da1f2' : '#eee',
                color: message.senderId === session.user.id ? 'white' : '#333',
                borderRadius: '12px',
                wordWrap: 'break-word',
                position: 'relative',
              }}
            >
              {message.content}
              {message.senderId === session.user.id && (
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: 'none',
                    border: 'none',
                    color: '#999',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  ✗
                </button>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999', paddingX: '0.75rem' }}>
              {new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div style={{ backgroundColor: '#fee', color: '#c33', padding: '0.75rem', margin: '0 1rem 1rem 1rem', borderRadius: '4px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '1rem',
          borderTop: '1px solid #eee',
          backgroundColor: '#fff',
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Sua mensagem..."
          disabled={submitting}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '20px',
            fontSize: '1rem',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: submitting ? '#ccc' : '#1da1f2',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
