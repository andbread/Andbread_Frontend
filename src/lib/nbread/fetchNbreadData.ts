import { supabase } from "@/lib/supabaseClient"

export const fetchNbreadData = async (userId: string): Promise<{ nbread_id: string; payment_date: string | Date | null }[] | null> => {
  if (!userId) {
    console.error("userId가 유효하지 않습니다.")
    return null;
  }

  const { data, error } = await supabase
    .from("nbread_records")
    .select("nbread_id, payment_date")
    .eq("user_id", userId)

  if (error) {
    console.error("데이터 가져오기 실패:", error)
    return null;
  }

  return data?.map((item) => ({
    ...item,
    payment_date: item.payment_date ? new Date(item.payment_date) : null,
  })) ?? []
}
