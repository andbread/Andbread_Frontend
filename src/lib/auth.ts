
import { supabase } from "./supabaseClient";
import { LoginProvider } from "@/types/nbread";
export const login = async(provider: LoginProvider['provider']) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: `http://localhost:3000/auth/callback`,
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