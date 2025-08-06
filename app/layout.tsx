import type { Metadata } from 'next'
import { GeistSans } from '@vercel/fonts/geist-sans'
import { GeistMono } from '@vercel/fonts/geist-mono'
import './globals.css'

const geistSans = GeistSans({ variable: '--font-sans' })
const geistMono = GeistMono({ variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
