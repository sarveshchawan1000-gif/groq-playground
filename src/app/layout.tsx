import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aether AI Studio | Next-Gen AI Playground',
  description: 'Fast, responsive, provider-agnostic playground for streaming AI models with real-time token metrics, multimodal inputs, and prompt engineering tools.',
};

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-background text-zinc-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-200 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
