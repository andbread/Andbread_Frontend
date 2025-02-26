import { supabase } from "@/lib/supabaseClient";

export const getUserNbreads = async (userId: string) => {
  if (!userId) return [];

  const { data: participantEntries, error: participantError } = await supabase
    .from("participant") 
    .select("nbread_id")
    .eq("user_id", userId);

  if (participantError) {
    console.error("❌ Failed to fetch participant entries:", participantError.message);
    return [];
  }

  console.log(`✅ Retrieved participant entries:`, participantEntries);

  const nbreadIds = participantEntries.map((entry) => entry.nbread_id);

  if (nbreadIds.length === 0) {
    return [];
  }

  const { data: nbreads, error } = await supabase
    .from("nbread")
    .select("*")
    .in("id", nbreadIds);

  if (error) {
    console.error("❌ Failed to fetch nbreads:", error.message);
    return [];
  }

  return nbreads;
};
