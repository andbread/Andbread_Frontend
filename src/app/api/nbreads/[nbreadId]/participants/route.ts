import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, noContent, ok } from '@/app/api/_lib/response'
import { getParticipants } from '@/lib/server/participant/getParticipants'
import { insertParticipant } from '@/lib/server/participant/insertParticipant'
import { deleteParticipants } from '@/lib/server/participant/deleteParticipant'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ nbreadId: string }> }

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params

  try {
    const participants = await getParticipants(auth.client, nbreadId)
    return ok(participants)
  } catch (error) {
    captureAppError(error, {
      action: 'participant.list',
      tags: { nbreadId, userId: auth.user.id },
    })
    return fail(500, '참여자를 불러오지 못했습니다.')
  }
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params
  const body = (await request.json().catch(() => null)) as {
    isLeader?: unknown
  } | null

  if (!body || typeof body.isLeader !== 'boolean') {
    return fail(400, '참여 정보가 올바르지 않습니다.')
  }

  try {
    // 참여자는 항상 토큰의 사용자다.
    const result = await insertParticipant(
      auth.client,
      nbreadId,
      auth.user.id,
      body.isLeader,
    )
    return ok(result)
  } catch (error) {
    captureAppError(error, {
      action: 'participant.insert',
      tags: { nbreadId, userId: auth.user.id },
      extra: { isLeader: body.isLeader },
    })
    return fail(500, '엔빵에 참여하지 못했습니다.')
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params
  // 리더가 다른 참여자를 내보내는 기능이라 userId를 쿼리로 받는다.
  const userId = new URL(request.url).searchParams.get('userId')

  if (!userId) {
    return fail(400, '내보낼 참여자가 지정되지 않았습니다.')
  }

  try {
    await deleteParticipants(auth.client, userId, nbreadId)
    return noContent()
  } catch (error) {
    captureAppError(error, {
      action: 'participant.delete',
      tags: { userId, nbreadId },
    })
    return fail(500, '참여자를 내보내지 못했습니다.')
  }
}
