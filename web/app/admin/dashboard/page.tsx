'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Post } from '@/types';

interface DashboardMetrics {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  activeUsersToday: number;
  newUsersToday: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.token) {
      router.push('/login');
      return;
    }
    loadDashboard();
  }, [session?.token, router]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${session!.token}` },
      });
      const data = await response.json();
      setMetrics(data.metrics);
      setRecentPosts(data.recentPosts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    router.push('/login');
    return <div>Redirecionando...</div>;
  }

  if (loading) return <div style={{ padding: '1rem', textAlign: 'center' }}>Carregando...</div>;
  if (!metrics) return <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>Erro ao carregar dashboard</div>;

  const StatCard = ({ label, value }: { label: string; value: number }) => (
    <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1da1f2', marginBottom: '0.25rem' }}>{value.toLocaleString('pt-BR')}</div>
      <div style={{ fontSize: '0.9rem', color: '#666' }}>{label}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Dashboard de Admin</h1>

      {error && (
        <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Usuários Totais" value={metrics.totalUsers} />
        <StatCard label="Posts Totais" value={metrics.totalPosts} />
        <StatCard label="Comentários Totais" value={metrics.totalComments} />
        <StatCard label="Curtidas Totais" value={metrics.totalLikes} />
        <StatCard label="Usuários Ativos Hoje" value={metrics.activeUsersToday} />
        <StatCard label="Novos Usuários Hoje" value={metrics.newUsersToday} />
      </div>

      <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Posts Recentes</h2>

      {recentPosts.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: '2rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          Nenhum post recente
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {recentPosts.map((post) => (
            <div
              key={post.id}
              style={{
                border: '1px solid #eee',
                padding: '1rem',
                borderRadius: '4px',
                backgroundColor: '#fff',
              }}
            >
              <a href={`/profile/${post.author.username}`} style={{ color: '#1da1f2', textDecoration: 'none', fontWeight: 600 }}>
                {post.author.displayName}
              </a>
              <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.25rem 0' }}>@{post.author.username}</p>
              <p style={{ margin: '0.75rem 0', overflow: 'hidden', textOverflow: 'ellipsis', maxHeight: '3em' }}>{post.content}</p>

              <div style={{ display: 'flex', gap: '1rem', color: '#666', fontSize: '0.9rem' }}>
                <span>💬 {post.commentsCount}</span>
                <span>❤️ {post.likesCount}</span>
                <span>🔄 {post.repostsCount}</span>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <a
                  href={`/post/${post.id}`}
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f0f0f0',
                    color: '#333',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    marginRight: '0.5rem',
                  }}
                >
                  Ver Post
                </a>
                <a
                  href={`/admin/moderation`}
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#fee',
                    color: '#c33',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                  }}
                >
                  Moderar
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
