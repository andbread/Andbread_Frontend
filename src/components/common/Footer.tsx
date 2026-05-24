import Link from 'next/link'
import { FOOTER_LINKS } from '@/constants/footerLinks'

const Footer = () => {
  return (
    <footer className="mt-32 h-180 w-full border-t-2 border-gray-100 bg-background px-24 pb-24 pt-32">
      <div className="flex flex-col gap-20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-12">
            <span className="text-heading05 text-gray-700">문의사항</span>
            <a
              href={FOOTER_LINKS.inquiry}
              className="text-heading05 text-gray-400"
              target="_blank"
              rel="noreferrer"
            >
              nbread@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-12">
            <span className="text-heading05 text-gray-700">이메일</span>
            <a
              href={FOOTER_LINKS.email}
              className="text-heading05 text-gray-400"
              target="_blank"
              rel="noreferrer"
            >
              nbread@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-12">
            <span className="text-heading05 text-gray-700">Github</span>
            <a
              href={FOOTER_LINKS.github}
              className="text-heading05 text-gray-400"
              target="_blank"
              rel="noreferrer"
            >
              nbread@gmail.com
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
