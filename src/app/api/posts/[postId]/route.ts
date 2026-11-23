import { requireAuth } from '@/app/api/_lib/requireAuth'
import { fail, noContent } from '@/app/api/_lib/response'
import { updatePost } from '@/lib/server/post/updatePost'
import { deletePost } from '@/lib/server/post/deletePost'
import { captureAppError } from '@/lib/sentry/sentry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 설계서는 이 두 메서드를 /api/nbreads/[nbreadId]/posts/[postId]에 두었으나
 * deletePost 호출부가 postId만 넘겨 nbreadId를 알 수 없다.
 * 경로에 의미 없는 조각을 채워 넣는 대신 게시글 식별자만으로 접근한다.
 * 접근 제어는 기존과 동일하게 RLS가 담당한다.
 */
type RouteContext = { params: Promise<{ postId: string }> }

const parsePostId = async (context: RouteContext) => {
  const { postId } = await context.params
  const parsed = Number(postId)

  return Number.isInteger(parsed) ? parsed : null
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const postId = await parsePostId(context)
  if (postId === null) {
    return fail(400, '게시글 식별자가 올바르지 않습니다.')
  }

  const body = (await request.json().catch(() => null)) as {
    content?: unknown
  } | null

  if (!body || typeof body.content !== 'string') {
    return fail(400, '게시글 내용이 올바르지 않습니다.')
  }

  try {
    await updatePost(auth.client, postId, body.content)
    return noContent()
  } catch (error) {
    captureAppError(error, {
      action: 'post.update',
      tags: { postId: String(postId), userId: auth.user.id },
    })
    return fail(500, '게시글을 수정하지 못했습니다.')
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const postId = await parsePostId(context)
  if (postId === null) {
    return fail(400, '게시글 식별자가 올바르지 않습니다.')
  }

  try {
    await deletePost(auth.client, postId)
    return noContent()
  } catch (error) {
    captureAppError(error, {
      action: 'post.delete',
      tags: { postId: String(postId), userId: auth.user.id },
    })
    return fail(500, '게시글을 삭제하지 못했습니다.')
  }
}
