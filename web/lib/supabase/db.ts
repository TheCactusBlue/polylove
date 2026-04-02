import { createClient } from 'common/supabase/utils'
import { ENV_CONFIG } from 'common/envs/constants'

export function initSupabaseClient() {
  return createClient(ENV_CONFIG.supabaseUrl, ENV_CONFIG.supabaseAnonKey)
}

export const db = initSupabaseClient()
