import { supabase } from "./supabaseClient";
import { SocialProvider } from "@/components/login/LoginButton";
export const login = async(provider: SocialProvider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}