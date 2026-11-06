import type {Metadata} from 'next';
import { Bricolage_Grotesque, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'KABZA — The Great Property War',
  description: 'Baap ki property hai Badshah, par kabza karke dikha! 2D Multiplayer Territory-Capture Arcade Game.',
  openGraph: {
    title: 'KABZA — The Great Property War',
    description: 'Baap ki property hai Badshah, par kabza karke dikha! Capture the ancestral zameen in this Indori-Jabalpur Badshah arcade showdown.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KABZA — The Great Property War',
    description: 'Baap ki property hai Badshah, par kabza karke dikha! Capture the ancestral zameen in this Indori-Jabalpur Badshah arcade showdown.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${jakarta.variable} ${jetbrains.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased bg-[#1a1512] text-[#1a1512] select-none overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
