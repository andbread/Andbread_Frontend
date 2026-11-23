import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { getFriendList } from '@/lib/server/friend/getSearchFriend'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  // nbreadId가 있으면 초대 상태(inviteState)를 함께 붙여 준다.
  const nbreadId = new URL(request.url).searchParams.get('nbreadId')

  try {
    const friends = await getFriendList(auth.client, auth.user.id, nbreadId)
    return ok(friends)
  } catch (error) {
    captureAppError(error, {
      action: 'friend.list',
      tags: { userId: auth.user.id },
    })
    return fail(500, '친구 목록을 불러오지 못했습니다.')
  }
}
