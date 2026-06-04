'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FOOTER_LINKS } from '@/constants/footerLinks'

const HIDE_FOOTER_PATTERNS: RegExp[] = [
  /^\/nbread\/[^/]+$/, // 채팅/게시판 탭이 포함된 엔빵 상세 페이지
  /^\/terms-agreement$/,
]

const Footer = () => {
  const pathname = usePathname()

  const shouldHideFooter = HIDE_FOOTER_PATTERNS.some((pattern) =>
    pattern.test(pathname),
  )

  if (shouldHideFooter) {
    return null
  }

  return (
    <footer className="mt-32 h-180 w-full border-t-2 border-gray-100 bg-background px-24 pb-24 pt-32">
      <div className="flex flex-col gap-20">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-12">
            <span className="text-heading05 text-gray-700">문의사항</span>
            <a
              href={FOOTER_LINKS.inquiry}
              className="text-body02 text-gray-400"
              target="_blank"
              rel="noreferrer"
            >
              구글 폼으로 문의하기
            </a>
          </div>
          <div className="flex items-center gap-12">
            <span className="text-heading05 text-gray-700">이메일</span>
            <a
              href={FOOTER_LINKS.email}
              className="text-body02 text-gray-400"
              target="_blank"
              rel="noreferrer"
            >
              nbread12@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-12">
            <span className="text-heading05 text-gray-700">Github</span>
            <a
              href={FOOTER_LINKS.github}
              className="text-body02 text-gray-400"
              target="_blank"
              rel="noreferrer"
            >
              Github 바로가기
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-12 text-body04 text-gray-400">
            <Link href={FOOTER_LINKS.termsOfService}>이용약관</Link>
            <span>|</span>
            <Link href={FOOTER_LINKS.privacyPolicy}>개인정보처리방침</Link>
          </div>
          <p className="text-body04 text-gray-400">
            © 2026. Nbread. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
