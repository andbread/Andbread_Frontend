import { supabase } from "../supabaseClient";
import { sendFriendProps } from "@/components/friend/PlusFriendListItem";
export const sendFriendRequest = async ({receiverId,senderId,status}: sendFriendProps) => {
    const {data, error} = await supabase.from('friend_request').insert([{
        sender_id : senderId,
        receiver_id : receiverId,
        status : status
    }])
    .select('status')
    if(error) {
        console.error(error)
    }
    return data
}