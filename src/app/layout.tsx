import type { Metadata } from 'next'
import '../styles/globals.css'
import ProtectRoute from './protectRoute'

export const metadata: Metadata = {
  title: '엔빵',
  description: '구독 공유 관리 서비스',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
      </head>
      <body className={`font-pre`} suppressHydrationWarning>
        <ProtectRoute>{children}</ProtectRoute>
      </body>
    </html>
  )
}
