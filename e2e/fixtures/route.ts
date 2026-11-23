/**
 * Route Handler를 서버 없이 직접 호출할 때 넘길 Request를 만든다.
 * 호스트는 핸들러가 경로와 쿼리만 읽으므로 의미가 없다.
 */
export const routeRequest = (
  path: string,
  {
    token,
    method = 'GET',
    body,
  }: { token?: string; method?: string; body?: unknown } = {},
) => {
  const headers: Record<string, string> = {}

  if (token) headers.authorization = `Bearer ${token}`
  if (body !== undefined) headers['content-type'] = 'application/json'

  return new Request(new URL(path, 'http://localhost'), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

/** 동적 세그먼트가 있는 핸들러의 두 번째 인자를 만든다. */
export const routeContext = <T extends Record<string, string>>(params: T) => ({
  params: Promise.resolve(params),
})
