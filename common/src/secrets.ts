// Secrets are expected to be set in process.env by the deployer.
// Use whatever secret manager you prefer (AWS SSM, Vault, dotenv, etc.)

export const secrets = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_PASSWORD',
  'TEST_CREATE_USER_KEY',
  'GEODB_API_KEY',
  'RESEND_KEY',
] as const

// No-op: secrets are expected to already be in process.env.
export const loadSecretsToEnv = async () => {}
