import { supabase } from './supabaseClient'
import { adminSupabase } from './supabaseAdminClient'
import { LoginProvider } from '@/types/user'
import useUserStore from '@/stores/useAuthStore'
import { useRouter } from 'next/navigation'
export const login = async (provider: LoginProvider['provider']) => {
  const redirectToUrl = process.env.NEXT_PUBLIC_REDIRECT_URL
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: redirectToUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
export const logout = async (router: ReturnType<typeof useRouter>) => {
  const data = await supabase.auth.signOut()
  console.log(data)
  useUserStore.getState().clearUser()
  sessionStorage.removeItem('user-store')
  router.replace('/login')
}
export const deleteAccount = async (router: ReturnType<typeof useRouter>) => {
    const data = await supabase.auth.getUser();
    console.log(data.data.user?.id);
    const user = data.data.user?.id;
    if(!user) {
        throw new Error("유저정보를 찾을수 없음");
    }
    const deleteUser = await adminSupabase.auth.admin.deleteUser(user);
    useUserStore.getState().clearUser()
  sessionStorage.removeItem('user-store')
  await supabase.auth.signOut();
  router.replace('/login')
}
