// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PasswordGate from '@/components/PasswordGate'

const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700'], display: 'swap' })

export const metadata: Metadata = {
  title: 'convo.finance | Jordanian Banking Intelligence',
  description: 'Competitive intelligence platform covering all 15 Jordanian banks.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var s=localStorage.getItem('hbtf-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||((!s)&&d)){document.documentElement.classList.add('dark');}}catch(e){}})();`
        }} />
      </head>
      <body className={inter.className}><PasswordGate>{children}</PasswordGate></body>
    </html>
  )
}
