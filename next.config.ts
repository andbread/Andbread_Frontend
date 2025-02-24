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
    domains: ["k.kakaocdn.net", "lh3.googleusercontent.com"],
  },
}

export default nextConfig
