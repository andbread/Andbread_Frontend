import { register } from 'module'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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

// const withPWA = require('next-pwa')({
//   dest: 'public',
//   disable: process.env.NODE_ENV === 'development',
//   register: true,
//   scope: '/',
//   sw: 'sw.js',
//   customWorkerDir: 'src/worker',
// })

// module.exports = withPWA(nextConfig)

export default nextConfig
