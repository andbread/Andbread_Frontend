import { Nbread } from '@/types/nbread'
import { create } from 'zustand'

interface NbreadStore {
  nbread: Nbread | null
  setNbread: (nbread: Nbread) => void
  clearNbread: () => void
}

// TODO 초기값 null에서 객체로 직접 필드 초기값 지정, store 변수명 변경 필요(newNbread, createNbread 등..)
const useNbreadStore = create<NbreadStore>()((set) => ({
  nbread: null,
  setNbread: (nbread) => set({ nbread: nbread }),
  clearNbread: () => set({ nbread: null }),
}))

export default useNbreadStore
