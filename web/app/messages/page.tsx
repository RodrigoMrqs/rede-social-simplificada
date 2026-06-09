'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { messageService } from '@/services/messageService';
import { Conversation } from '@/types';

export default function MessagesPage() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!session?.token) {
      router.push('/login');
      return;
    }
    loadConversations();
  }, [session?.token, authLoading, router]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations(session!.token);
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  if (!session) return <div>Carregando...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Mensagens</h1>

      {error && (
        <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>Carregando...</div>}

      {!loading && conversations.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          Você não tem mensagens. <a href="/search" style={{ color: '#1da1f2', textDecoration: 'none' }}>Buscar usuários</a> para iniciar uma conversa
        </div>
      )}

      {conversations.map((conversation) => (
        <a
          key={conversation.id}
          href={`/messages/${conversation.id}`}
          style={{
            display: 'block',
            padding: '1rem',
            border: '1px solid #eee',
            marginBottom: '0.5rem',
            borderRadius: '4px',
            backgroundColor: conversation.unreadCount > 0 ? '#f0f8ff' : '#fff',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = conversation.unreadCount > 0 ? '#e8f4ff' : '#f5f5f5')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = conversation.unreadCount > 0 ? '#f0f8ff' : '#fff')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: 600 }}>{conversation.participant.displayName}</div>
            {conversation.unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: '#1da1f2',
                  color: 'white',
                  borderRadius: '50%',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {conversation.unreadCount}
              </span>
            )}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>@{conversation.participant.username}</div>
          {conversation.lastMessage && (
            <div style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conversation.lastMessage.content}
            </div>
          )}
        </a>
      ))}
    </div>
  );
}
