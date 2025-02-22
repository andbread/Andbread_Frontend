import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// import { User } from '@/types/nbread';
import { User } from '@/types/user';

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-store', // 세션 스토리지에 저장될 키 이름
      storage: createJSONStorage(() => sessionStorage), // ✅ JSON 파싱 문제 해결
    }
  )
);

export default useUserStore;
