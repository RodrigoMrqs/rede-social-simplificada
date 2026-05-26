'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { postService } from '@/services/postService';
import { Post as PostType, Comment } from '@/types';

export default function PostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { session } = useAuth();
  const [post, setPost] = useState<PostType & { comments: Comment[] } | null>(null);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session?.token) {
      router.push('/login');
      return;
    }
    loadPost();
  }, [postId, session?.token, router]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const data = await postService.getPost(session!.token, postId);
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar post');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newComment.trim()) {
      setError('O comentário não pode estar vazio');
      return;
    }

    setSubmitting(true);
    try {
      const comment = await postService.addComment(session!.token, postId, newComment);
      setPost((prev) => (prev ? { ...prev, comments: [...prev.comments, comment], commentsCount: prev.commentsCount + 1 } : null));
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar comentário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      if (post.likedByMe) {
        await postService.unlikePost(session!.token, postId);
      } else {
        await postService.likePost(session!.token, postId);
      }
      setPost({
        ...post,
        likedByMe: !post.likedByMe,
        likesCount: post.likesCount + (post.likedByMe ? -1 : 1),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao curtir');
    }
  };

  if (!session) return <div>Carregando...</div>;
  if (loading) return <div style={{ padding: '1rem', textAlign: 'center' }}>Carregando...</div>;
  if (!post) return <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>Post não encontrado</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <button
        onClick={() => router.back()}
        style={{
          background: 'none',
          border: 'none',
          color: '#1da1f2',
          cursor: 'pointer',
          fontSize: '1rem',
          marginBottom: '1rem',
        }}
      >
        ← Voltar
      </button>

      <div style={{ border: '1px solid #eee', padding: '1.5rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'start', marginBottom: '1rem' }}>
          <div>
            <a href={`/profile/${post.author.username}`} style={{ color: '#1da1f2', textDecoration: 'none', fontWeight: 600 }}>
              {post.author.displayName}
            </a>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>@{post.author.username}</p>
          </div>
        </div>

        <p style={{ fontSize: '1.3rem', margin: '1rem 0' }}>{post.content}</p>

        <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1rem' }}>{new Date(post.createdAt).toLocaleString('pt-BR')}</p>

        <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '1rem 0' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{post.commentsCount}</div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>Comentários</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{post.repostsCount}</div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>Reposts</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{post.likesCount}</div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>Curtidas</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', padding: '1rem 0' }}>
          <button
            onClick={handleLike}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              color: post.likedByMe ? '#e81828' : '#666',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: post.likedByMe ? 600 : 400,
            }}
          >
            {post.likedByMe ? '❤️' : '🤍'} Curtir
          </button>
          <button
            style={{
              flex: 1,
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            🔄 Repostar
          </button>
        </div>
      </div>

      <form onSubmit={handleAddComment} style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Compartilhe sua opinião!"
            disabled={submitting}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              fontFamily: 'system-ui, sans-serif',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee', color: '#c33', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: submitting ? '#ccc' : '#1da1f2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Enviando...' : 'Comentar'}
        </button>
      </form>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Comentários</h2>
        {post.comments.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center' }}>Nenhum comentário ainda. Seja o primeiro!</p>
        ) : (
          post.comments.map((comment) => (
            <div key={comment.id} style={{ border: '1px solid #eee', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
              <a href={`/profile/${comment.author.username}`} style={{ color: '#1da1f2', textDecoration: 'none', fontWeight: 600 }}>
                {comment.author.displayName}
              </a>
              <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.25rem 0' }}>@{comment.author.username}</p>
              <p style={{ margin: '0.5rem 0 0 0' }}>{comment.content}</p>
              <p style={{ color: '#999', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>{new Date(comment.createdAt).toLocaleString('pt-BR')}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
