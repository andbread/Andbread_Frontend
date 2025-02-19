import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },
  // TODO 구글, 카카오 프로필 이미지 도메인 추가 필요
  images: {
    domains: ['avatars.githubusercontent.com'], // TODO 프로필 이미지 테스트용 임시 도메인, 수정 필요
  },
}

export default nextConfig
