import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quantmail — Biometric Identity Gateway',
  description: 'AI-powered biometric email client with autonomous co-pilot',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cyber-darker text-slate-200 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
