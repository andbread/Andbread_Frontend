import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { getSearchFriend } from '@/lib/server/friend/getSearchFriend'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const tag = new URL(request.url).searchParams.get('tag')

  if (!tag) {
    return fail(400, '검색할 태그가 없습니다.')
  }

  try {
    const users = await getSearchFriend(auth.client, tag, auth.user.id)
    return ok(users)
  } catch (error) {
    captureAppError(error, {
      action: 'friend.search',
      tags: { userId: auth.user.id },
    })
    return fail(500, '사용자를 검색하지 못했습니다.')
  }
}
