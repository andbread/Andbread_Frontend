import { apiRequest } from '@/lib/apiClient'
import { Post } from '@/types/post'

export const getPost = async (nbreadId: string) => {
  try {
    return await apiRequest<Post[]>(`/api/nbreads/${nbreadId}/posts`)
  } catch (error) {
    // 실패 시 아무 값도 돌려주지 않던 기존 동작을 유지한다.
    console.error('게시글을 찾을수 없어!', error)
  }
}
