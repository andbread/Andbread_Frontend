// stores/nbreadPaymentState.ts
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { fetchNbreadData } from "@/lib/nbread/fetchNbreadData"  

interface NbreadPaymentState {
  nbreadData: { nbread_id: string; payment_date: string | Date | null }[]
  setNbreadData: (nbreadData: { nbread_id: string; payment_date: string | Date | null }[]) => void
  clearNbreadData: () => void
  fetchNbreadData: (userId: string) => Promise<void>
}

const useNbreadPaymentState = create<NbreadPaymentState>()(
  persist(
    (set, get) => ({
      nbreadData: [],
      setNbreadData: (nbreadData) => set({ nbreadData }),
      clearNbreadData: () => set({ nbreadData: [] }),

      fetchNbreadData: async (userId) => {
        // fetchNbreadData 호출
        const nbreadData = await fetchNbreadData(userId);

        if (nbreadData) {
          set({ nbreadData });
        }
      },
    }),
    {
      name: "nbread-payment-state", 
      storage: createJSONStorage(() => sessionStorage), 
    }
  )
)

export default useNbreadPaymentState
