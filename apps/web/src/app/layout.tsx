import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AudioProvider } from '@/contexts/AudioContext';

export const metadata: Metadata = {
  title: 'Code Runner',
  description: 'An online Python compiler for learning and practice.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        {/* Preconnect for faster font loading - actual fonts loaded via globals.css */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* REMOVED: Duplicate Inter + unused Source Code Pro - fonts now only in globals.css */}
      </head>
      <body className="font-body antialiased">
        <AudioProvider>
          {children}
          <Toaster />
        </AudioProvider>
      </body>
    </html>
  );
}
