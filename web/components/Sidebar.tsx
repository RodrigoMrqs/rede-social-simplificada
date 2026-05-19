'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';

const NAV_ITEMS = [
  { label: 'Feed',         icon: '🏠', href: '/feed' },
  { label: 'Busca',        icon: '🔍', href: '/feed' },
  { label: 'Notificações', icon: '🔔', href: '/feed' },
  { label: 'Mensagens',    icon: '✉️',  href: '/feed' },
  { label: 'Novo Post',    icon: '✏️',  href: '/feed' },
];

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

function NavLink({
  href,
  icon,
  label,
  collapsed,
  color,
}: {
  href: string;
  icon: string;
  label: string;
  collapsed: boolean;
  color?: string;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : '12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: '11px 10px',
        borderRadius: '8px',
        textDecoration: 'none',
        color: color ?? '#1a1a1a',
        fontSize: '15px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        transition: 'background 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = color ? '#fff0f0' : '#f0f0f0';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      <span style={{ fontSize: '19px', flexShrink: 0, width: '24px', textAlign: 'center' }}>
        {icon}
      </span>
      {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
    </Link>
  );
}

export default function Sidebar({ collapsed, onToggle }: Props) {
  const { session, setSession } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (!session?.token) return;
    try {
      await authService.logout(session.token);
    } finally {
      setSession(null);
      router.push('/login');
    }
  };

  const profileHref = session?.user ? `/profile/${session.user.username}` : '/login';

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: collapsed ? 64 : 240,
        borderRight: '1px solid #e5e5e5',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: '16px 12px 12px',
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <Link
            href="/feed"
            style={{ fontSize: '20px', fontWeight: 700, textDecoration: 'none', color: '#1a1a1a' }}
          >
            Ágora
          </Link>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir' : 'Recolher'}
          style={{
            background: 'none',
            border: '1px solid #e5e5e5',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '4px 7px',
            color: '#555',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Nav — cresce e rola se necessário */}
      <nav
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
          padding: '0 8px',
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            href={item.href}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
          />
        ))}
        <NavLink href={profileHref} icon="👤" label="Perfil"        collapsed={collapsed} />
        <NavLink href="/settings"   icon="⚙️" label="Configurações" collapsed={collapsed} />
      </nav>

      {/* Rodapé — sempre visível */}
      <div
        style={{
          borderTop: '1px solid #e5e5e5',
          padding: '12px 8px',
          flexShrink: 0,
        }}
      >
        {session?.user ? (
          <>
            {!collapsed && (
              <div style={{ padding: '2px 10px 8px' }}>
                <div
                  style={{
                    fontWeight: 600, fontSize: '13px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {session.user.displayName}
                </div>
                <div
                  style={{
                    fontSize: '12px', color: '#666',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  @{session.user.username}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title={collapsed ? 'Sair' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : '12px',
                padding: '11px 10px',
                borderRadius: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#dc3545',
                fontSize: '15px',
                fontWeight: 500,
                width: '100%',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff0f0'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '19px', flexShrink: 0, width: '24px', textAlign: 'center' }}>🚪</span>
              {!collapsed && 'Sair'}
            </button>
          </>
        ) : collapsed ? (
          <Link
            href="/login"
            title="Entrar"
            style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              padding: '10px', borderRadius: '8px', textDecoration: 'none',
              fontSize: '18px', backgroundColor: '#1a1a1a', color: '#fff',
            }}
          >
            🔑
          </Link>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Link
              href="/login"
              style={{
                display: 'flex', justifyContent: 'center', padding: '10px 12px',
                borderRadius: '8px', textDecoration: 'none', fontSize: '14px',
                fontWeight: 600, backgroundColor: '#1a1a1a', color: '#fff',
              }}
            >
              Entrar
            </Link>
            <Link
              href="/register"
              style={{
                display: 'flex', justifyContent: 'center', padding: '10px 12px',
                borderRadius: '8px', textDecoration: 'none', fontSize: '14px',
                fontWeight: 600, border: '1px solid #1a1a1a', color: '#1a1a1a',
              }}
            >
              Cadastrar
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
