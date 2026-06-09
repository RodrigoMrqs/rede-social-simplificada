'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/userService';
import { User } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { session, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');

  useEffect(() => {
    if (authLoading) return;
    if (!session?.token) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [username, session?.token, authLoading, router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/users/${username}`, {
        headers: { Authorization: `Bearer ${session!.token}` },
      });
      const userData = await response.json();
      setUser(userData);
      setIsFollowing(userData.isFollowing || false);

      const followersRes = await userService.getFollowers(session!.token, userData.id) as unknown as User[];
      setFollowers(followersRes);

      const followingRes = await userService.getFollowing(session!.token, userData.id) as unknown as User[];
      setFollowing(followingRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    try {
      if (isFollowing) {
        await userService.unfollow(session!.token, user.id);
      } else {
        await userService.follow(session!.token, user.id);
      }
      setIsFollowing(!isFollowing);
      setUser({ ...user, followersCount: user.followersCount + (isFollowing ? -1 : 1) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao seguir usuário');
    }
  };

  if (authLoading) return <div>Carregando...</div>;
  if (loading) return <div style={{ padding: '1rem', textAlign: 'center' }}>Carregando...</div>;
  if (!user) return <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>Usuário não encontrado</div>;

  const isOwnProfile = session.user.username === username;

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

      <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem' }}>
        {user.coverUrl && (
          <div style={{ height: '200px', background: `url(${user.coverUrl}) center/cover`, marginBottom: '1rem' }} />
        )}

        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, marginBottom: '0.25rem', fontSize: '1.5rem' }}>{user.displayName}</h1>
              <p style={{ margin: 0, color: '#666' }}>@{user.username}</p>
            </div>
            {!isOwnProfile && (
              <button
                data-testid="follow-btn"
                onClick={handleFollow}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isFollowing ? '#f0f0f0' : '#1da1f2',
                  color: isFollowing ? '#333' : 'white',
                  border: isFollowing ? '1px solid #ddd' : 'none',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </button>
            )}
          </div>

          {user.bio && <p style={{ margin: '0 0 1rem 0', lineHeight: 1.5 }}>{user.bio}</p>}

          <div style={{ display: 'flex', gap: '2rem', color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontWeight: 600, color: '#333' }}>{user.followersCount}</span> Seguidores
            </div>
            <div>
              <span style={{ fontWeight: 600, color: '#333' }}>{user.followingCount}</span> Seguindo
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', gap: '2rem' }}>
            <button
              onClick={() => setActiveTab('posts')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                borderBottom: activeTab === 'posts' ? '3px solid #1da1f2' : 'none',
                color: activeTab === 'posts' ? '#1da1f2' : '#666',
                cursor: 'pointer',
                fontWeight: activeTab === 'posts' ? 600 : 400,
                fontSize: '0.9rem',
              }}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                borderBottom: activeTab === 'followers' ? '3px solid #1da1f2' : 'none',
                color: activeTab === 'followers' ? '#1da1f2' : '#666',
                cursor: 'pointer',
                fontWeight: activeTab === 'followers' ? 600 : 400,
                fontSize: '0.9rem',
              }}
            >
              Seguidores
            </button>
            <button
              onClick={() => setActiveTab('following')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                borderBottom: activeTab === 'following' ? '3px solid #1da1f2' : 'none',
                color: activeTab === 'following' ? '#1da1f2' : '#666',
                cursor: 'pointer',
                fontWeight: activeTab === 'following' ? 600 : 400,
                fontSize: '0.9rem',
              }}
            >
              Seguindo
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {activeTab === 'followers' && (
        <div>
          {followers.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>Sem seguidores</p>
          ) : (
            followers.map((follower) => (
              <a
                key={follower.id}
                href={`/profile/${follower.username}`}
                style={{
                  display: 'block',
                  padding: '1rem',
                  border: '1px solid #eee',
                  marginBottom: '0.5rem',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ fontWeight: 600 }}>{follower.displayName}</div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>@{follower.username}</div>
              </a>
            ))
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div>
          {following.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>Não segue ninguém</p>
          ) : (
            following.map((followee) => (
              <a
                key={followee.id}
                href={`/profile/${followee.username}`}
                style={{
                  display: 'block',
                  padding: '1rem',
                  border: '1px solid #eee',
                  marginBottom: '0.5rem',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ fontWeight: 600 }}>{followee.displayName}</div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>@{followee.username}</div>
              </a>
            ))
          )}
        </div>
      )}

      {activeTab === 'posts' && (
        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          Os posts deste usuário serão exibidos aqui
        </div>
      )}
    </div>
  );
}
