import { loginWithGoogle } from 'web/lib/auth/supabase-auth'

export const signupThenMaybeRedirectToSignup = async () => {
  // Supabase OAuth uses redirect flow — the user will be redirected to Google,
  // then back to /auth/callback, which redirects to home.
  // The auth context will handle checking if they need to complete signup.
  await loginWithGoogle()
}
