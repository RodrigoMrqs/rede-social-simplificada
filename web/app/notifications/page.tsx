'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notificationService';
import { Notification } from '@/types';

export default function NotificationsPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!session?.token) {
      router.push('/login');
      return;
    }
    loadNotifications(1);
  }, [session?.token, authLoading, router]);

  const loadNotifications = async (p: number, append = false) => {
    try {
      setLoading(true);
      const rows = await notificationService.getNotifications(session!.token, p);
      setNotifications(append ? (prev) => [...prev, ...rows] : rows);
      setHasMore(rows.length === 20);
      setPage(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount(session!.token);
      setUnreadCount(data.count);
    } catch (err) {
      // Silent fail for unread count
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead(session!.token);
      setNotifications(notifications.map((n) => ({ ...n, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar como lido');
    }
  };

  const getNotificationText = (notification: Notification): string => {
    const actor = notification.actor.displayName;
    const types: Record<string, string> = {
      follow: `${actor} começou a te seguir`,
      like: `${actor} curtiu seu post`,
      comment: `${actor} comentou em seu post`,
      repost: `${actor} repostou seu post`,
      mention: `${actor} te mencionou`,
    };
    return types[notification.type] || 'Você tem uma nova notificação';
  };

  if (!session) return <div>Carregando...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>
          Notificações {unreadCount > 0 && <span style={{ backgroundColor: '#e81828', color: 'white', borderRadius: '50%', padding: '0.25rem 0.5rem', fontSize: '0.85rem', marginLeft: '0.5rem' }}>{unreadCount}</span>}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              color: '#1da1f2',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            Marcar tudo como lido
          </button>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>Carregando...</div>}

      {!loading && notifications.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          Você não tem notificações
        </div>
      )}

      {notifications.map((notification) => (
        <a
          key={notification.id}
          href={notification.postId ? `/post/${notification.postId}` : `/profile/${notification.actor.username}`}
          style={{
            display: 'block',
            padding: '1rem',
            border: '1px solid #eee',
            marginBottom: '0.5rem',
            borderRadius: '4px',
            backgroundColor: notification.readAt ? '#fff' : '#f0f8ff',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = notification.readAt ? '#f5f5f5' : '#e8f4ff')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = notification.readAt ? '#fff' : '#f0f8ff')}
        >
          <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
            <div style={{ fontSize: '1.5rem' }}>
              {notification.type === 'follow' && '👤'}
              {notification.type === 'like' && '❤️'}
              {notification.type === 'comment' && '💬'}
              {notification.type === 'repost' && '🔄'}
              {notification.type === 'mention' && '@'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{notification.actor.displayName}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>{getNotificationText(notification)}</div>
              <div style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {new Date(notification.createdAt).toLocaleString('pt-BR')}
              </div>
            </div>
            {!notification.readAt && (
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1da1f2', flexShrink: 0 }} />
            )}
          </div>
        </a>
      ))}

      {hasMore && !loading && (
        <button
          onClick={() => loadNotifications(page + 1, true)}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#1da1f2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '1rem',
          }}
        >
          Carregar mais
        </button>
      )}
    </div>
  );
}
