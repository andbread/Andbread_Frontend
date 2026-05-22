/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://nbread-nbread.vercel.app',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 7000,
  exclude: [
    '/auth/*',
    '/calendar',
    '/friendList',
    '/icon.ico',
    '/inviteAccept',
    '/manifest.json',
    '/mypage',
    '/mypage/*',
    '/nbread/*',
    '/notification',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: [
          '/auth/',
          '/calendar',
          '/friendList',
          '/inviteAccept',
          '/mypage',
          '/nbread/',
          '/notification',
        ],
      },
    ],
  },
}
