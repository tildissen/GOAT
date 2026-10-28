import type { Metadata, Viewport } from 'next';
import { Knewave, Playfair_Display } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});
/** Bara logotypen och öppningsbilden ("Låt oss spela"). */
const knewave = Knewave({ subsets: ['latin'], weight: '400', variable: '--font-knewave' });
/** Allt annat: knappar, namn, frågor (fet) och förklaringar (vanlig). */
const glacial = localFont({
  src: [
    { path: '../fonts/glacial-indifference-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/glacial-indifference-400italic.woff2', weight: '400', style: 'italic' },
    { path: '../fonts/glacial-indifference-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-glacial',
});

export const metadata: Metadata = {
  title: 'G.O.A.T.',
  description: 'Dryckesspelet som börjar oskyldigt… och slutar i fullständigt kaos.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#5ce1e6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${playfair.variable} ${knewave.variable} ${glacial.variable}`}>
      <body>{children}</body>
    </html>
  );
}
