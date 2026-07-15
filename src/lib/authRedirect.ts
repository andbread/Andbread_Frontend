const DEFAULT_REDIRECT_PATH = '/home'

export const getSafeRedirectPath = (next: string | null | undefined) => {
  if (!next) {
    return DEFAULT_REDIRECT_PATH
  }

  const isInternalPath =
    next.startsWith('/') && !next.startsWith('//') && !next.includes('\\')

  if (!isInternalPath) {
    return DEFAULT_REDIRECT_PATH
  }

  // 현재 로그인 후 리다이렉트는 홈과 토큰 초대 페이지 경로만 허용한다.
  const isAllowedPath = next === '/home' || next.startsWith('/invite/')

  if (!isAllowedPath) {
    return DEFAULT_REDIRECT_PATH
  }

  return next
}
