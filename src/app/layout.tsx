import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

import { Analytics } from '@vercel/analytics/next';

import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Park Bingo by R3m00n',
  description: 'Daily changing bingo game to make your park visits more fun!',
  openGraph: {
    title: 'Park Bingo by R3m00n',
    description: 'Daily changing bingo game to make your park visits more fun!',
    url: 'https://bingo.merlin.hamburg',
    siteName: 'Park Bingo',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Park Bingo Preview',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Park Bingo by R3m00n',
    description: 'Daily changing bingo game to make your park visits more fun!',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='de'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <main>{children}</main>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
