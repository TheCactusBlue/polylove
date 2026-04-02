export type EnvConfig = {
  domain: string
  supabaseUrl: string
  supabaseAnonKey: string
  posthogKey: string
  apiEndpoint: string
  adminIds: string[]
  modIds: string[]
  faviconPath: string
}

function parseList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export const ENV_CONFIG: EnvConfig = {
  domain: process.env.NEXT_PUBLIC_DOMAIN ?? 'localhost:3000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '',
  apiEndpoint: process.env.NEXT_PUBLIC_API_URL ?? 'localhost:8088',
  adminIds: parseList(process.env.NEXT_PUBLIC_ADMIN_IDS),
  modIds: parseList(process.env.NEXT_PUBLIC_MOD_IDS),
  faviconPath: process.env.NEXT_PUBLIC_FAVICON_PATH ?? '/favicon.ico',
}
