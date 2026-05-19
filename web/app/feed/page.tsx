"use client";

import React, { useState, useEffect, ReactElement } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { postService } from '@/services/postService';
import { Post } from '@/types';

export default function FeedPage() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (cursor?: string) => {
    if (!session?.token) {
      setError('Você precisa estar logado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await postService.getFeed(session.token, cursor);
      if (cursor) {
        setPosts((prev) => [...prev, ...response.items]);
      } else {
        setPosts(response.items);
      }
      setNextCursor(response.nextCursor);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!session?.token) return;

    try {
      if (isLiked) {
        await postService.unlikePost(session.token, postId);
      } else {
        await postService.likePost(session.token, postId);
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe: !isLiked,
                likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1,
              }
            : p,
        ),
      );
    } catch (err) {
      console.error('Erro ao atualizar like:', err);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!session?.token) return;

    if (!confirm('Tem certeza que deseja deletar este post?')) return;

    try {
      await postService.deletePost(session.token, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao deletar post');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <h1>Feed</h1>
        <Link
          href="/post/new"
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            alignSelf: 'flex-start',
          }}
        >
          Novo Post
        </Link>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {loading && !posts.length ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Carregando...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Nenhum post para exibir
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAuthor={session?.user.id === post.authorId}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          ))}

          {nextCursor && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={() => loadFeed(nextCursor)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Carregando...' : 'Carregar Mais'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PostCard({
  post,
  isAuthor,
  onLike,
  onDelete,
}: {
  post: Post;
  isAuthor: boolean;
  onLike: (postId: string, isLiked: boolean) => void;
  onDelete: (postId: string) => void;
}) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        backgroundColor: '#fafafa',
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <Link
          href={`/profile/${post.author.username}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ fontWeight: 'bold', cursor: 'pointer' }}>
            {post.author.displayName}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>@{post.author.username}</div>
        </Link>
      </div>

      <Link href={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <p style={{ marginBottom: '10px', cursor: 'pointer' }}>{post.content}</p>
      </Link>

      <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
        {new Date(post.createdAt).toLocaleString('pt-BR')}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '20px',
          fontSize: '14px',
          borderTop: '1px solid #eee',
          paddingTop: '10px',
        }}
      >
        <button
          onClick={() => onLike(post.id, post.likedByMe)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: post.likedByMe ? '#dc3545' : '#666',
            fontSize: '14px',
          }}
        >
          ❤️ {post.likesCount} {post.likedByMe ? '(Curtido)' : ''}
        </button>

        <Link href={`/post/${post.id}`} style={{ textDecoration: 'none', color: '#666' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            💬 {post.commentsCount}
          </button>
        </Link>

        {isAuthor && (
          <button
            onClick={() => onDelete(post.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#dc3545',
            }}
          >
            🗑️ Deletar
          </button>
        )}
      </div>
    </div>
  );
}
