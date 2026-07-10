import type { Metadata } from 'next'
import '../styles/globals.css'
import ProtectRoute from './protectRoute'
import Toast from '@/components/common/toast/Toast'
import GoogleAnalytics from '@/lib/analytics/GoogleAnalytics'
import PageViewTracker from '@/lib/analytics/PageViewTracker'
import ClarityProvider from '@/lib/analytics/ClarityProvider'
import Footer from '@/components/common/Footer'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '엔빵',
    template: '%s | 엔빵',
  },
  description:
    '친구와 함께 쓰는 구독 서비스를 한 번에 관리하고, 결제일과 정산 금액까지 깔끔하게 확인하는 구독 공유 관리 서비스',
  keywords: [
    '엔빵',
    '구독 공유',
    '구독 관리',
    '정산 관리',
    '결제일 관리',
    'OTT 공유',
    '요금 분담',
  ],
  applicationName: '엔빵',
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: '/icon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: '엔빵',
    description:
      '친구와 함께 쓰는 구독 서비스를 한 번에 관리하고, 결제일과 정산 금액까지 깔끔하게 확인하세요.',
    url: '/',
    siteName: '엔빵',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/assets/logo/open-graph-logo.png',
        width: 1200,
        height: 630,
        alt: '엔빵 로고',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '엔빵',
    description:
      '친구와 함께 쓰는 구독 서비스를 한 번에 관리하고, 결제일과 정산 금액까지 깔끔하게 확인하세요.',
    images: ['/assets/logo/open-graph-logo.png'],
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
      </head>
      <body className={`font-pre`} suppressHydrationWarning>
        <Toast />
        <ClarityProvider />
        <PageViewTracker />
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
        )}
        <ProtectRoute>{children}</ProtectRoute>
        <Footer />
      </body>
    </html>
  )
}
