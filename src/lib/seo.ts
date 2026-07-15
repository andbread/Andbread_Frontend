import type { Metadata } from 'next'

export const SITE_URL = 'https://www.nbread.co.kr'

export const NO_INDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

const SITE_NAME = '엔빵'
const OG_IMAGE = {
  url: '/assets/logo/open-graph-logo.png',
  width: 1200,
  height: 630,
  alt: '엔빵 로고',
}

interface PageMetadataParams {
  title: string
  description: string
  path: string
  absoluteTitle?: boolean
}

export const createPageMetadata = ({
  title,
  description,
  path,
  absoluteTitle = false,
}: PageMetadataParams): Metadata => {
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: 'ko_KR',
      type: 'website',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [OG_IMAGE.url],
    },
  }
}
