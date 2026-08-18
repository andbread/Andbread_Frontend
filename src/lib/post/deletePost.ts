import { apiRequest } from '@/lib/apiClient'

// 호출부가 postId만 넘기므로 게시글 식별자만으로 접근한다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deletePost = async (post: any) => {
  try {
    await apiRequest(`/api/posts/${post}`, { method: 'DELETE' })

    return null
  } catch (error) {}
}
