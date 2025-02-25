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
    domains: ["k.kakaocdn.net", "lh3.googleusercontent.com", "img1.kakaocdn.net", "t1.kakaocdn.net"],
  },
}

export default nextConfig
