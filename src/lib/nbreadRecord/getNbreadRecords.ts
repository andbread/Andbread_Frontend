import { apiRequest } from '@/lib/apiClient'
import { NbreadRecord } from '@/types/nbread'

export const getNbreadRecords = async (nbreadId: string, startDate: string) => {
  try {
    return await apiRequest<NbreadRecord[]>(
      `/api/nbreads/${nbreadId}/records`,
      { query: { startDate } },
    )
  } catch (error) {
    console.error('Error fetching nbread record:', error)
    throw error
  }
}
