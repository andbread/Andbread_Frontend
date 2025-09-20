import { createClient } from 'npm:@supabase/supabase-js@2'

export const supabaseClient = createClient(
  Deno.env.get('PROJECT_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!,
)
