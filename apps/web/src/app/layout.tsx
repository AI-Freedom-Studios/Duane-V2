import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'AIFREEDOMSTUDIOS | AgentOS by AI Freedom Studios',
  description: 'Public homepage for AIFREEDOMSTUDIOS and AgentOS, including product overview, privacy information, and sign-in access.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
