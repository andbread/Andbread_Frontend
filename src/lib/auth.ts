
import { supabase } from "./supabaseClient";
import { LoginProvider } from "@/types/user";
import useUserStore from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
export const login = async(provider: LoginProvider['provider']) => {
    const redirectToUrl = process.env.NEXT_PUBLIC_REDIRECT_URL;
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: redirectToUrl,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
          },
          
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}
export const logout = async (router: ReturnType<typeof useRouter>) => {
    
    const data = await supabase.auth.signOut();
    console.log(data);
    useUserStore.getState().clearUser();
    sessionStorage.removeItem('user-store');
    router.replace('/login');
    

}