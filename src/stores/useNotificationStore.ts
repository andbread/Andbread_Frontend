import { create } from 'zustand'

interface NotificationStore {
  count: number
  setCount: (count: number) => void
}

const useNotificationStore = create<NotificationStore>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
}))

export default useNotificationStore
