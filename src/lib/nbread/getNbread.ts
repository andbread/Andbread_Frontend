import { apiRequest } from '@/lib/apiClient'
import { Nbread } from '@/types/nbread'

export const getNbread = async (nbreadId: string) => {
  try {
    return await apiRequest<Nbread>(`/api/nbreads/${nbreadId}`)
  } catch (error) {
    console.error('Error fetching nbread:', error)
    throw error
  }
}
