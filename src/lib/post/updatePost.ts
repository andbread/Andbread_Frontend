import { apiRequest } from '@/lib/apiClient'
import { Post } from '@/types/post'

export const UpdatePost = async (post: Pick<Post, 'id' | 'content'>) => {
  try {
    await apiRequest(`/api/posts/${post.id}`, {
      method: 'PATCH',
      body: { content: post.content },
    })

    return null
  } catch (error) {}
}
