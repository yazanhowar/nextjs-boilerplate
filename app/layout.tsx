// app/layout.tsx
import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import PasswordGate from '@/components/PasswordGate'

const ibmSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400','500','600','700'], display: 'swap', variable: '--font-ibm-sans' })
const ibmArabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400','500','600','700'], display: 'swap', variable: '--font-ibm-ar' })
const ibmMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400','500','600'], display: 'swap', variable: '--font-ibm-mono' })

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
      <body className={ibmSans.variable + ' ' + ibmArabic.variable + ' ' + ibmMono.variable + ' ' + ibmSans.className}><PasswordGate>{children}</PasswordGate></body>
    </html>
  )
}
