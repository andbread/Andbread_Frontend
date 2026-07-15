import NbreadsImage from '@/components/common/nbreadImage/NbreadsImage'
import LoginButton from '@/components/user/LoginButton'
import LoginRedirectGuard from '@/components/auth/LoginRedirectGuard'
import NbreadText from '@/assets/logo/nbread-text.svg'
import { getSafeRedirectPath } from '@/lib/authRedirect'
import { NO_INDEX_METADATA } from '@/lib/seo'

export const metadata = NO_INDEX_METADATA

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string | string[] }>
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const { redirect } = await searchParams
  const redirectPath = getSafeRedirectPath(
    typeof redirect === 'string' ? redirect : null,
  )

  return (
    <LoginRedirectGuard>
      <div className="flex h-svh w-full flex-col items-center justify-around">
        <div className="w-100% mt-80 flex flex-col items-center gap-16">
          <NbreadsImage />
          <NbreadText />
          <h3 className="text-secondary-100">구독 공유 관리 서비스</h3>
        </div>
        <div
          className={`mb-80 flex flex-col items-center justify-center gap-8`}
        >
          <LoginButton provider="kakao" next={redirectPath} />
          <LoginButton provider="google" next={redirectPath} />
        </div>
      </div>
    </LoginRedirectGuard>
  )
}
export default LoginPage
