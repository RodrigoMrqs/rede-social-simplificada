'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { postService } from '@/services/postService';

const MAX_POST_LENGTH = 280;

export default function NewPostPage() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!session?.token) router.push('/login');
  }, [session?.token, authLoading, router]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const remainingChars = MAX_POST_LENGTH - content.length;
  const isExceeded = remainingChars < 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!session?.token) {
      setError('Você precisa estar logado para publicar um post');
      router.push('/login');
      return;
    }

    if (!content.trim()) {
      setError('O post não pode estar vazio');
      return;
    }

    if (content.length > MAX_POST_LENGTH) {
      setError(`O post não pode ter mais de ${MAX_POST_LENGTH} caracteres`);
      return;
    }

    setLoading(true);

    try {
      await postService.createPost(session.token, content);
      router.push('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
      <h1>Novo Post</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <textarea
            value={content}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            disabled={loading}
            placeholder="O que você está pensando?"
            style={{
              width: '100%',
              padding: '12px',
              minHeight: '120px',
              fontSize: '16px',
              fontFamily: 'inherit',
              borderRadius: '4px',
              border: '1px solid #ddd',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {error && <span style={{ color: 'red' }}>{error}</span>}
          </div>
          <span
            style={{
              color: isExceeded ? 'red' : remainingChars < 50 ? 'orange' : 'gray',
              fontWeight: isExceeded ? 'bold' : 'normal',
            }}
          >
            {remainingChars >= 0 ? remainingChars : Math.abs(remainingChars)} caracteres
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading || isExceeded || !content.trim()}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: loading || isExceeded || !content.trim() ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || isExceeded || !content.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Publicando...' : 'Publicar'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
