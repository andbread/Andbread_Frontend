import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
// import { User } from '@/types/nbread';
import { User } from '@/types/user'
import { setSentryUser } from '@/lib/sentry/sentry'
import { USER_STORE_KEY } from '@/lib/authStorage'

interface UserStore {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => {
        setSentryUser({ id: user.id })
        set({ user })
      },
      clearUser: () => {
        setSentryUser(null)
        set({ user: null })
      },
    }),
    {
      name: USER_STORE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export default useUserStore
