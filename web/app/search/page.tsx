'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/userService';
import { User } from '@/types';

type PostResult = { id: string; authorId: string; content: string; createdAt: string };

export default function SearchPage() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session?.token) {
      router.push('/login');
    }
  }, [session?.token, authLoading, router]);

  if (authLoading) return null;
  if (!session) return null;

  const doSearch = async (q: string, p: number, append = false) => {
    setLoading(true);
    try {
      const res = await userService.search(session.token, q, p);
      setUsers(append ? (prev) => [...prev, ...(res.users ?? [])] : (res.users ?? []));
      setPosts(append ? (prev) => [...prev, ...(res.posts ?? [])] : (res.posts ?? []));
      setHasMore((res.users?.length ?? 0) === 20 || (res.posts?.length ?? 0) === 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setHasSearched(true);
    setPage(1);
    if (!query.trim()) { setUsers([]); setPosts([]); return; }
    await doSearch(query, 1);
  };

  const handleLoadMore = async () => {
    const next = page + 1;
    setPage(next);
    await doSearch(query, next, true);
  };

  const noResults = hasSearched && users.length === 0 && posts.length === 0 && !loading;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Buscar</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuários e posts..."
            style={{
              flex: 1, padding: '0.75rem', border: '1px solid #ddd',
              borderRadius: '4px', fontSize: '1rem', boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#ccc' : '#1da1f2',
              color: 'white', border: 'none', borderRadius: '4px',
              fontSize: '1rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {noResults && (
        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          {query.trim() ? 'Nenhum resultado encontrado' : 'Digite algo para buscar'}
        </div>
      )}

      {users.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#666', marginBottom: '0.5rem' }}>Usuários</h2>
          {users.map((user) => (
            <a
              key={user.id}
              href={`/profile/${user.username}`}
              style={{
                display: 'block', padding: '1rem', border: '1px solid #eee',
                marginBottom: '0.5rem', borderRadius: '4px', textDecoration: 'none',
                color: 'inherit', backgroundColor: '#fff',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
            >
              <div style={{ fontWeight: 600 }}>{user.displayName}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>@{user.username}</div>
              {user.bio && <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>{user.bio}</div>}
            </a>
          ))}
        </section>
      )}

      {posts.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#666', marginBottom: '0.5rem' }}>Posts</h2>
          {posts.map((post) => (
            <a
              key={post.id}
              href={`/post/${post.id}`}
              style={{
                display: 'block', padding: '1rem', border: '1px solid #eee',
                marginBottom: '0.5rem', borderRadius: '4px', textDecoration: 'none',
                color: 'inherit', backgroundColor: '#fff',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
            >
              <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{post.content}</div>
              <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {new Date(post.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </a>
          ))}
        </section>
      )}

      {hasMore && !loading && (
        <button
          onClick={handleLoadMore}
          style={{
            width: '100%', padding: '0.75rem', backgroundColor: '#1da1f2',
            color: 'white', border: 'none', borderRadius: '4px',
            fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem',
          }}
        >
          Carregar mais
        </button>
      )}
    </div>
  );
}
