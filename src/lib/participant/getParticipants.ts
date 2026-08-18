import { apiRequest } from '@/lib/apiClient'
import { Participant } from '@/types/nbread'

export const getParticipants = async (
  nbreadId: string,
): Promise<Participant[]> => {
  try {
    return await apiRequest<Participant[]>(
      `/api/nbreads/${nbreadId}/participants`,
    )
  } catch (error) {
    console.error('error fetching participants', error)
    throw error
  }
}
