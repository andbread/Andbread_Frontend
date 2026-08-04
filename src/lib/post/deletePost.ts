import { supabase } from '../supabaseClient'
export const deletePost = async (post: any) => {
  try {
    const { data, error } = await supabase
      .from('post')
      .delete()
      .eq('id', post)
      if(error){
        console.error(error)
      }
      return data
  } catch (error) {}
}
