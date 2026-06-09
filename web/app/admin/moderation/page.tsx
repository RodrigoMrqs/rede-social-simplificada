'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Post, User } from '@/types';

export default function AdminModerationPage() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!session?.token) {
      router.push('/login');
      return;
    }
    loadModerationData();
  }, [session?.token, authLoading, router]);

  const loadModerationData = async () => {
    try {
      setLoading(true);
      const postsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/posts`, {
        headers: { Authorization: `Bearer ${session!.token}` },
      });
      const postsData = await postsRes.json();
      setPosts(postsData.items || []);

      const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/users`, {
        headers: { Authorization: `Bearer ${session!.token}` },
      });
      const usersData = await usersRes.json();
      setUsers(usersData.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de moderação');
    } finally {
      setLoading(false);
    }
  };

  const handleHidePost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja ocultar este post?')) return;
    try {
      setError('');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/posts/${postId}/hide`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session!.token}` },
      });
      setSuccess('Post ocultado com sucesso');
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ocultar post');
    }
  };

  const handleRestorePost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja restaurar este post?')) return;
    try {
      setError('');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/posts/${postId}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session!.token}` },
      });
      setSuccess('Post restaurado com sucesso');
      loadModerationData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao restaurar post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja deletar este post permanentemente?')) return;
    try {
      setError('');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session!.token}` },
      });
      setSuccess('Post deletado com sucesso');
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar post');
    }
  };

  const handleSanctionUser = async (userId: string, reason: string) => {
    if (!confirm('Tem certeza que deseja suspender este usuário?')) return;
    try {
      setError('');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/users/${userId}/sanction`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session!.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, type: 'suspend' }),
      });
      setSuccess('Usuário suspenso com sucesso');
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao suspender usuário');
    }
  };

  if (!session) {
    router.push('/login');
    return <div>Redirecionando...</div>;
  }

  if (loading) return <div style={{ padding: '1rem', textAlign: 'center' }}>Carregando...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Moderação</h1>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('posts')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 0',
            borderBottom: activeTab === 'posts' ? '3px solid #1da1f2' : 'none',
            color: activeTab === 'posts' ? '#1da1f2' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'posts' ? 600 : 400,
            fontSize: '1rem',
          }}
        >
          Posts ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 0',
            borderBottom: activeTab === 'users' ? '3px solid #1da1f2' : 'none',
            color: activeTab === 'users' ? '#1da1f2' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'users' ? 600 : 400,
            fontSize: '1rem',
          }}
        >
          Usuários ({users.length})
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: '#efe', color: '#3c3', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      {activeTab === 'posts' && (
        <div>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              Nenhum post para moderar
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                style={{
                  border: '1px solid #eee',
                  padding: '1rem',
                  marginBottom: '1rem',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <a href={`/profile/${post.author.username}`} style={{ color: '#1da1f2', textDecoration: 'none', fontWeight: 600 }}>
                      {post.author.displayName}
                    </a>
                    <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>@{post.author.username}</p>
                  </div>
                  {post.hiddenAt && <span style={{ backgroundColor: '#fee', color: '#c33', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>Oculto</span>}
                </div>

                <p style={{ margin: '0.75rem 0' }}>{post.content}</p>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  {!post.hiddenAt ? (
                    <button
                      onClick={() => handleHidePost(post.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#fee',
                        color: '#c33',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Ocultar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestorePost(post.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#efe',
                        color: '#3c3',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Restaurar
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#fee',
                      color: '#c33',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              Nenhum usuário para moderar
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                style={{
                  border: '1px solid #eee',
                  padding: '1rem',
                  marginBottom: '1rem',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <a href={`/profile/${user.username}`} style={{ color: '#1da1f2', textDecoration: 'none', fontWeight: 600 }}>
                    {user.displayName}
                  </a>
                  <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>@{user.username}</p>
                  <p style={{ color: '#999', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                    Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <button
                  onClick={() => handleSanctionUser(user.id, 'Violação das políticas da comunidade')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#fee',
                    color: '#c33',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Suspender
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
