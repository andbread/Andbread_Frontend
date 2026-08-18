import { apiRequest } from '@/lib/apiClient'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const UpdatePost = async (post: any) => {
  try {
    await apiRequest(`/api/posts/${post.id}`, {
      method: 'PATCH',
      body: { content: post.content },
    })

    return null
  } catch (error) {}
}
