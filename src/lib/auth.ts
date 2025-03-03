import { supabase } from './supabaseClient'
import { adminSupabase } from './supabaseAdminClient'
import { LoginProvider } from '@/types/user'
import useUserStore from '@/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/common/toast/Toast'

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
  setTimeout(() => {
    useToast.success('로그아웃이 완료되었어요.')
    router.replace('/login')
  }, 1000)
}

export const deleteAccount = async (router: ReturnType<typeof useRouter>) => {
  const data = await supabase.auth.getUser()
  console.log(data.data.user?.id)
  const user = data.data.user?.id
  if (!user) {
    throw new Error('유저정보를 찾을수 없음')
  }
  await adminSupabase.auth.admin.deleteUser(user),supabase.auth.signOut
  useUserStore.getState().clearUser()
  sessionStorage.removeItem('user-store')
  setTimeout(() => {
    useToast.success('회원 탈퇴가 완료되었어요.')
    router.replace('/login')
  }, 1000)
}
export const getUserName = async (leaderId:string) => {
  try {
if(!leaderId){
  console.log('리더의 이름을 찾을수 없습니다! ');
  return null;
}
    const { data, error } = await supabase
    .from('user')
    .select('name')
    .eq('id', leaderId) 
    .single();
    if (error) {
      throw new Error(error.message);
    }

    // 데이터가 없으면 null 반환
    if (!data) {
      return null;
    }

    // 사용자 이름 반환
    return data.name;
  }   catch (error) {
    // 에러 처리
    console.error('Error fetching user name:', error);
    return null; // 에러 발생 시 null 반환
  }

}
export const getUser = async (accessToken : string) => {
  const data = await supabase.auth.getUser(accessToken);
  return data
}
