import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { getChatMessages } from '@/lib/server/chatMessage/getChatMessages'
import { insertChatMessage } from '@/lib/server/chatMessage/insertChatMessage'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ nbreadId: string }> }

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params

  try {
    const messages = await getChatMessages(auth.client, nbreadId)
    return ok(messages)
  } catch (error) {
    captureAppError(error, {
      action: 'chat_message.list',
      tags: { nbreadId, userId: auth.user.id },
    })
    return fail(500, '메시지를 불러오지 못했습니다.')
  }
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params
  const body = (await request.json().catch(() => null)) as {
    content?: unknown
    userName?: unknown
    userProfileImage?: unknown
  } | null

  if (!body || typeof body.content !== 'string' || !body.content) {
    return fail(400, '메시지 내용이 올바르지 않습니다.')
  }

  // 표시용 이름과 프로필은 기존과 동일하게 클라이언트가 준 값을 저장한다.
  if (typeof body.userName !== 'string') {
    return fail(400, '작성자 정보가 올바르지 않습니다.')
  }

  const userProfileImage =
    typeof body.userProfileImage === 'string' ? body.userProfileImage : null

  try {
    const message = await insertChatMessage(
      auth.client,
      nbreadId,
      auth.user.id,
      body.userName,
      userProfileImage,
      body.content,
    )
    return ok(message, 201)
  } catch (error) {
    captureAppError(error, {
      action: 'chat_message.insert',
      tags: { nbreadId, userId: auth.user.id },
    })
    return fail(500, '메시지를 보내지 못했습니다.')
  }
}
