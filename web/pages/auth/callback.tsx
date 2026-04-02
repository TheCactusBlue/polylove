import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Supabase client automatically picks up the session from the URL hash.
    // Just redirect to home after a brief moment to allow the auth state to settle.
    const timer = setTimeout(() => {
      router.replace('/')
    }, 100)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Signing in...</p>
    </div>
  )
}
