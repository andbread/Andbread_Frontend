import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },

  images: {
    domains: [
      'k.kakaocdn.net',
      'lh3.googleusercontent.com',
      'img1.kakaocdn.net',
      't1.kakaocdn.net',
    ],
  },
}

export default withSentryConfig(nextConfig, {
  org: 'nbread',
  project: 'nbread',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  tunnelRoute: '/monitoring',
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
