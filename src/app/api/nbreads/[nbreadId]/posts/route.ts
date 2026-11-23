import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, ok } from '@/app/api/_lib/response'
import { getPost } from '@/lib/server/post/getPost'
import { insertPost } from '@/lib/server/post/insertPost'
import { captureAppError } from '@/lib/sentry/sentry'
import { PostInsert } from '@/types/post'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ nbreadId: string }> }

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params

  try {
    const posts = await getPost(auth.client, nbreadId)
    return ok(posts)
  } catch (error) {
    captureAppError(error, {
      action: 'post.list',
      tags: { nbreadId, userId: auth.user.id },
    })
    return fail(500, '게시글을 불러오지 못했습니다.')
  }
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { nbreadId } = await context.params
  const body = (await request.json().catch(() => null)) as PostInsert | null

  if (!body || typeof body.content !== 'string') {
    return fail(400, '게시글 내용이 올바르지 않습니다.')
  }

  try {
    // 작성자는 항상 토큰의 사용자다.
    await insertPost(auth.client, nbreadId, auth.user.id, body)
    return ok(null, 201)
  } catch (error) {
    captureAppError(error, {
      action: 'post.insert',
      tags: { nbreadId, userId: auth.user.id },
    })
    return fail(500, '게시글을 작성하지 못했습니다.')
  }
}
