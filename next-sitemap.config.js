/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.nbread.co.kr',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 7000,
  exclude: [
    '/auth/*',
    '/calendar',
    '/friendList',
    '/home',
    '/icon.ico',
    '/invite/*',
    '/invites',
    '/login',
    '/manifest.json',
    '/mypage',
    '/mypage/*',
    '/nbread/*',
    '/notification',
    '/terms-agreement',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/auth/',
          '/calendar',
          '/friendList',
          '/home',
          '/invites',
          '/mypage',
          '/nbread/',
          '/notification',
          '/terms-agreement',
        ],
      },
    ],
  },
}
