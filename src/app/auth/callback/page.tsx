import AuthCallbackClient from '@/components/auth/AuthCallbackClient'
import { getSafeRedirectPath } from '@/lib/authRedirect'

interface CallbackPageProps {
  searchParams: Promise<{ next?: string | string[] }>
}

const CallbackPage = async ({ searchParams }: CallbackPageProps) => {
  const { next } = await searchParams
  const nextPath = getSafeRedirectPath(typeof next === 'string' ? next : null)

  return <AuthCallbackClient next={nextPath} />
}

export default CallbackPage
