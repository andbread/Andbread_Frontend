'use client'

import NbreadNotFound from '@/assets/logo/nbreads-not-found.svg'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const Page = () => {
  const router = useRouter()

  useEffect(() => {
    ;(window as any).__IS_NOT_FOUND_PAGE__ = true
    return () => {
      ;(window as any).__IS_NOT_FOUND_PAGE__ = false
    }
  }, [])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-20">
      <h1 className="text-64 text-gray-600">404</h1>
      <h2 className="text-gray-600">NOT FOUND</h2>
      <div className="mb-40 text-body01 text-gray-400">
        요청하신 페이지를 찾을 수 없어요.
      </div>
      <NbreadNotFound />
      <div
        className="mt-64 cursor-pointer text-body01 text-gray-700"
        onClick={() => router.replace('/home')}
      >
        홈으로 가기
      </div>
    </div>
  )
}

export default Page
