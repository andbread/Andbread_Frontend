import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, noContent, ok } from '@/app/api/_lib/response'
import { getNbread } from '@/lib/server/nbread/getNbread'
import { updateNbread } from '@/lib/server/nbread/updateNbread'
import { deleteNbread } from '@/lib/server/nbread/deleteNbread'
import { captureAppError } from '@/lib/sentry/sentry'
import { Nbread } from '@/types/nbread'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ nbreadId: string }> }

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params

  try {
    const nbread = await getNbread(auth.client, nbreadId)
    return ok(nbread)
  } catch (error) {
    captureAppError(error, {
      action: 'nbread.get',
      tags: { nbreadId, userId: auth.user.id },
    })
    return fail(500, '엔빵을 불러오지 못했습니다.')
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params
  const body = (await request.json().catch(() => null)) as Nbread | null

  if (!body || typeof body.title !== 'string') {
    return fail(400, '엔빵 정보가 올바르지 않습니다.')
  }

  try {
    await updateNbread(auth.client, nbreadId, body)
    return noContent()
  } catch (error) {
    captureAppError(error, {
      action: 'nbread.update',
      tags: { nbreadId, leaderId: body.leaderId ?? undefined },
    })
    return fail(500, '엔빵을 수정하지 못했습니다.')
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params

  try {
    await deleteNbread(auth.client, nbreadId)
    return noContent()
  } catch (error) {
    captureAppError(error, {
      action: 'nbread.delete',
      tags: { nbreadId },
    })
    return fail(500, '엔빵을 삭제하지 못했습니다.')
  }
}
