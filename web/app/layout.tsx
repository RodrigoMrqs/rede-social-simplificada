import type { Metadata } from 'next';
import { AuthProvider } from '@/store/AuthContext';

export const metadata: Metadata = {
  title: 'Ágora',
  description: 'Plataforma de microblogging',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
