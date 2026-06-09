import AuthCallbackClient from '@/components/auth/AuthCallbackClient'

interface CallbackPageProps {
  searchParams: Promise<{ next?: string | string[] }>
}

const CallbackPage = async ({ searchParams }: CallbackPageProps) => {
  const { next } = await searchParams
  const nextPath = typeof next === 'string' ? next : null

  // callback URL의 next 값을 인증 처리 컴포넌트에 전달한다.
  return <AuthCallbackClient next={nextPath} />
}

export default CallbackPage
