'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/userService';
import { User } from '@/types';

export default function SearchPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setHasSearched(true);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await userService.search(session!.token, query);
      setResults(response.items);
      setCursor(response.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const response = await userService.search(session!.token, query, cursor);
      setResults([...results, ...response.items]);
      setCursor(response.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    router.push('/login');
    return <div>Redirecionando...</div>;
  }

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
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#ccc' : '#1da1f2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 600,
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

      {hasSearched && results.length === 0 && !loading && (
        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          {query.trim() ? 'Nenhum resultado encontrado' : 'Digite algo para buscar'}
        </div>
      )}

      {results.map((user) => (
        <a
          key={user.id}
          href={`/profile/${user.username}`}
          style={{
            display: 'block',
            padding: '1rem',
            border: '1px solid #eee',
            marginBottom: '0.5rem',
            borderRadius: '4px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'background-color 0.2s',
            backgroundColor: '#fff',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
        >
          <div style={{ fontWeight: 600 }}>{user.displayName}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>@{user.username}</div>
          {user.bio && <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>{user.bio}</div>}
        </a>
      ))}

      {cursor && !loading && (
        <button
          onClick={handleLoadMore}
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
