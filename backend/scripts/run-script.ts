import { loadSecretsToEnv } from 'common/secrets'
import {
  createSupabaseDirectClient,
  type SupabaseDirectClient,
} from 'shared/supabase/init'

export const runScript = async (
  main: (services: { pg: SupabaseDirectClient }) => Promise<any> | any
) => {
  await loadSecretsToEnv()

  const pg = createSupabaseDirectClient()
  await main({ pg })

  process.exit()
}
