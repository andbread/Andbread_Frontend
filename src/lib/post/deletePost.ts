import { apiRequest } from '@/lib/apiClient'

export const deletePost = async (post: number) => {
  try {
    await apiRequest(`/api/posts/${post}`, { method: 'DELETE' })

    return null
  } catch (error) {}
}
