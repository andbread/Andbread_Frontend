import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, noContent, ok } from '@/app/api/_lib/response'
import { sendFriendRequest } from '@/lib/server/friend/sendFriendRequest'
import {
  updateAcceptFriend,
  updateRejectedFriend,
} from '@/lib/server/friend/updateFriend'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = (await request.json().catch(() => null)) as {
    receiverId?: unknown
    status?: unknown
  } | null

  if (
    !body ||
    typeof body.receiverId !== 'string' ||
    !body.receiverId ||
    typeof body.status !== 'string'
  ) {
    return fail(400, '친구 요청 값이 올바르지 않습니다.')
  }

  try {
    // 보내는 사람은 항상 토큰의 사용자다.
    const result = await sendFriendRequest(
      auth.client,
      auth.user.id,
      body.receiverId,
      body.status,
    )
    return ok(result)
  } catch (error) {
    captureAppError(error, {
      action: 'friend.send_request',
      tags: { userId: auth.user.id, receiverId: body.receiverId },
    })
    return fail(500, '친구 요청을 보내지 못했습니다.')
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = (await request.json().catch(() => null)) as {
    senderId?: unknown
    status?: unknown
  } | null

  // 요청을 받은 쪽이 수락하거나 거절하므로 receiverId는 토큰의 사용자다.
  if (
    !body ||
    typeof body.senderId !== 'string' ||
    !body.senderId ||
    (body.status !== 'accepted' && body.status !== 'rejected')
  ) {
    return fail(400, '친구 응답 값이 올바르지 않습니다.')
  }

  try {
    if (body.status === 'accepted') {
      await updateAcceptFriend(auth.client, auth.user.id, body.senderId)
    } else {
      await updateRejectedFriend(auth.client, auth.user.id, body.senderId)
    }

    return noContent()
  } catch (error) {
    captureAppError(error, {
      action: `friend.${body.status}`,
      tags: { userId: auth.user.id, senderId: body.senderId },
    })
    return fail(500, '친구 요청에 응답하지 못했습니다.')
  }
}
