'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/userService';
import { authService } from '@/services/authService';

export default function SettingsPage() {
  const router = useRouter();
  const { session, setSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'security' | 'notifications'>('security');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notificationPreferences, setNotificationPreferences] = useState({
    notifyFollow: true,
    notifyLike: true,
    notifyComment: true,
    notifyRepost: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    userService.getNotificationPreferences(session.token)
      .then((prefs) => setNotificationPreferences(prefs))
      .catch(() => {});
  }, [session?.token]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As novas senhas não conferem');
      return;
    }

    if (newPassword.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(session!.token, currentPassword, newPassword);
      setSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout(session!.token);
      setSession(null);
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer logout');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza que deseja deletar sua conta? Esta ação é irrevogável.')) return;

    setLoading(true);
    try {
      await userService.deleteAccount(session!.token);
      setSession(null);
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar conta');
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
      <h1 style={{ marginBottom: '1.5rem' }}>Configurações</h1>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('security')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 0',
            borderBottom: activeTab === 'security' ? '3px solid #1da1f2' : 'none',
            color: activeTab === 'security' ? '#1da1f2' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'security' ? 600 : 400,
            fontSize: '1rem',
          }}
        >
          Segurança
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 0',
            borderBottom: activeTab === 'notifications' ? '3px solid #1da1f2' : 'none',
            color: activeTab === 'notifications' ? '#1da1f2' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'notifications' ? 600 : 400,
            fontSize: '1rem',
          }}
        >
          Notificações
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

      {activeTab === 'security' && (
        <div>
          <form onSubmit={handleChangePassword} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Alterar Senha</h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Senha Atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

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
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Conta</h2>

            <button
              onClick={handleLogout}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '1rem',
              }}
            >
              Sair
            </button>

            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#fee',
                color: '#c33',
                border: '1px solid #fcc',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Deletar Conta
            </button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Preferências de Notificação</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'notifyFollow', label: 'Notificações de Seguidor' },
              { key: 'notifyLike', label: 'Notificações de Curtida' },
              { key: 'notifyComment', label: 'Notificações de Comentário' },
              { key: 'notifyRepost', label: 'Notificações de Repost' },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notificationPreferences[key as keyof typeof notificationPreferences]}
                  onChange={(e) =>
                    setNotificationPreferences({
                      ...notificationPreferences,
                      [key]: e.target.checked,
                    })
                  }
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <button
            disabled={loading}
            onClick={async () => {
              setError('');
              setSuccess('');
              setLoading(true);
              try {
                await userService.updateNotificationPreferences(session!.token, notificationPreferences);
                setSuccess('Preferências salvas com sucesso!');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao salvar preferências');
              } finally {
                setLoading(false);
              }
            }}
            style={{
              marginTop: '2rem',
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
            {loading ? 'Salvando...' : 'Salvar Preferências'}
          </button>
        </div>
      )}
    </div>
  );
}
