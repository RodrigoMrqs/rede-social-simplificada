'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.25s ease',
        }}
      >
        {children}
      </main>
    </div>
  );
}
