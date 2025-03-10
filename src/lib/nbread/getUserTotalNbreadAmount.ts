import { supabase } from "@/lib/supabaseClient";

export const getUserTotalNbreadAmount = async (userId: string) => {
  if (!userId) return 0;

  // 사용자가 속한 nbread_records에서 is_paid=true인 데이터 가져오기
  const { data: paidRecords, error: paidError } = await supabase
    .from("nbread_records")
    .select("nbread_id")
    .eq("user_id", userId)
    .eq("is_paid", true);

  if (paidError) {
    console.error("❌ Failed to fetch paid records:", paidError.message);
    return 0;
  }

  if (!paidRecords || paidRecords.length === 0) return 0;

  const nbreadIds = paidRecords.map((record) => record.nbread_id);

  // 해당 nbread_id에 대한 엔빵 정보 가져오기
  const { data: nbreads, error: nbreadError } = await supabase
    .from("nbread")
    .select("id, amount, participant_count")
    .in("id", nbreadIds);

  if (nbreadError) {
    console.error("❌ Failed to fetch nbreads:", nbreadError.message);
    return 0;
  }

  const totalAmount = nbreads.reduce((sum, nbread) => {
    const individualShare = Math.floor(nbread.amount / Math.max(nbread.participant_count, 1));
    return sum + individualShare;
  }, 0);

  return totalAmount;
};
