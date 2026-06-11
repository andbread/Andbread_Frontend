import { supabase } from '../supabaseClient'
import { Post } from '@/types/post'
export const getPost = async (nbreadId: string) => {
  try {
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .eq('nbread_id', nbreadId)
      .order('created_at', { ascending: false })
      if(error){
        console.error("게시글을 찾을수 없어!",error)
        return
      }
      return data
  } catch (error) {

  }
}
