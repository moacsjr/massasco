import './global.css';
import { ClientProviders } from '../components/providers';
import { TokenInjector } from '@temp-workspace/token-bridge';
import { ExtensionPoint } from '@temp-workspace/plugin-loader';
import { initializePlugins } from '../plugins-registry';
import Link from 'next/link';

// Lê os tokens diretamente
import tokens from '../../../../ui-project/tokens/tokens.json';

export const metadata = {
  title: 'DevXP Portal v2.2',
  description: 'Internal Developer Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inicializa plugins no lado do servidor
  initializePlugins();

  return (
    <html lang="en">
      <head>
        <TokenInjector tokens={tokens} />
      </head>
      <body>
        <ClientProviders>
          <Link href="/" className="fixed bottom-3 left-3 z-dropdown bg-card/80 backdrop-blur text-foreground px-3 py-1.5 rounded-md no-underline text-xs hover:bg-card transition-colors border border-border">
            🏠 Home
          </Link>
          <ExtensionPoint id="app:main-template" props={{ children }} />
        </ClientProviders>
      </body>
    </html>
  );
}

