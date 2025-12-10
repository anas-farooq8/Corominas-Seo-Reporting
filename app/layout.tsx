import type { Metadata } from 'next'

import { Analytics } from '@vercel/analytics/next'
import './globals.css'

import { Geist, Geist_Mono, Geist as V0_Font_Geist, Geist_Mono as V0_Font_Geist_Mono, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'

// Initialize fonts
const _geist = V0_Font_Geist({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })

export const metadata: Metadata = {
  title: 'Corominas Consulting - SEO Reporting System',
  description: 'Professional SEO reporting and analytics dashboard for Corominas Consulting clients',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: 'https://www.google.com/s2/favicons?domain=corominas-consulting.de&sz=32',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: 'https://www.google.com/s2/favicons?domain=corominas-consulting.de&sz=64',
        sizes: '64x64',
        type: 'image/png',
      },
    ],
    apple: {
      url: 'https://www.google.com/s2/favicons?domain=corominas-consulting.de&sz=180',
      sizes: '180x180',
      type: 'image/png',
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
