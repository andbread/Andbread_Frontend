"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import useUserStore from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';
const CallbackPage = () => {
  const [loading, setLoading] = useState(true);
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Error fetching user data:', error.message);
          return;
        }

        if (data.user) {
          const provider = data.user.app_metadata.provider as 'kakao' | 'google';

          const userInfo = {
            id: data.user.id,
            email: data.user.email || '',
            socialType : provider,
            name: data.user.user_metadata.full_name || '',
            profileImage: data.user.user_metadata.avatar_url || '',
          };
          setUser(userInfo); // 사용자 정보 세션 스토리지에 저장
          router.replace('/');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router,setUser]);



  return <div>{loading ? 'Loading...' : 'Redirecting...'}</div>;
};

export default CallbackPage;
