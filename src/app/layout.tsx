import type { Metadata, Viewport } from 'next';
import { Jost, League_Spartan, Playfair_Display } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});
const spartan = League_Spartan({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-spartan' });
const jost = Jost({ subsets: ['latin'], weight: ['300', '400', '600'], style: ['normal', 'italic'], variable: '--font-jost' });

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
    <html lang="sv" className={`${playfair.variable} ${spartan.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
