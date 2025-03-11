import type { Metadata } from 'next'
import '../styles/globals.css'
import ProtectRoute from './protectRoute'
import Toast from '@/components/common/toast/Toast'
import GoogleAnalytics from '@/lib/GoogleAnalytics'


export const metadata: Metadata = {
  title: '엔빵',
  description: '구독 공유 관리 서비스',
  keywords: '구독, 관리, 공유, 엔빵',
  openGraph: {
    title: '엔빵',
    description: '구독 공유 관리 서비스',
    url: 'https://nbread-nbread.vercel.app/',
    images: [
      {
        url: 'https://nbread-nbread.vercel.app/assets/logo/open-graph-logo.png', 
        alt: '엔빵 로고',  
      },
    ],
  },
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
        <script src="https://developers.kakao.com/sdk/js/kakao.js"></script>
      </head>
      <body className={`font-pre`} suppressHydrationWarning>
        <Toast />
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
        )}
        <ProtectRoute>{children}</ProtectRoute>
      </body>
    </html>
  )
}
