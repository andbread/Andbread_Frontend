import { Nbread } from '@/types/nbread'
import { create } from 'zustand'

interface NbreadStore {
  nbread: Nbread | null
  setNbread: (nbread: Nbread | null) => void
}

const useNbreadStore = create<NbreadStore>()((set) => ({
  nbread: null,
  setNbread: (nbread) => set({ nbread: nbread }),
}))

export default useNbreadStore
