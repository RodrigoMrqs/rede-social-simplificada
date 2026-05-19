'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@/types';

const SESSION_KEY = 'agora_session';

type AuthContextType = {
  session: Session | null;
  setSession: (session: Session | null) => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) setSessionState(JSON.parse(stored));
    } catch {
      // localStorage indisponível ou dado corrompido
    }
  }, []);

  const setSession = (s: Session | null) => {
    setSessionState(s);
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // sem suporte a localStorage
    }
  };

  return (
    <AuthContext.Provider value={{ session, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
