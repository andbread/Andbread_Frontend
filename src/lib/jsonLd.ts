import { SITE_URL } from '@/lib/seo'

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdObject
  | JsonLdValue[]

export interface JsonLdObject {
  [key: string]: JsonLdValue
}

const SITE_NAME = '엔빵'
const SITE_DESCRIPTION =
  '친구와 가족과 나누는 구독 서비스의 결제일과 정산 현황을 한 곳에서 관리하는 구독 공유 관리 서비스'

const getAbsoluteUrl = (path: string) => new URL(path, SITE_URL).toString()

export const landingPageJsonLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: getAbsoluteUrl('/assets/logo/nbread-logo.png'),
        width: 512,
        height: 512,
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: 'ko-KR',
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#web-application`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: 'ko-KR',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
  ],
}
