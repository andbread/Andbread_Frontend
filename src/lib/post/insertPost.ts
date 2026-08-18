import { apiRequest } from '@/lib/apiClient'
import { PostInsert } from '@/types/post'

export const InsertPost = async (post: PostInsert) => {
  try {
    await apiRequest(`/api/nbreads/${post.nbreadId}/posts`, {
      method: 'POST',
      body: post,
    })

    // 기존에도 insert 결과가 null이라 항상 null을 돌려줬다.
    return null
  } catch (error) {
    console.error(error)
  }
}
