import type { Metadata } from 'next'
import './globals.css'

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
      </body>
    </html>
  )
}
