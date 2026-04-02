'use client'
import { createContext, ReactNode, useEffect, useState } from 'react'
import { db } from 'web/lib/supabase/db'
import { api } from 'web/lib/api'
import { randomString } from 'common/util/random'
import { useStateCheckEquality } from 'web/hooks/use-state-check-equality'
import {
  type PrivateUser,
  type User,
  type UserAndPrivateUser,
} from 'common/user'
import { safeLocalStorage } from 'web/lib/util/local'
import { useEffectCheckEquality } from 'web/hooks/use-effect-check-equality'
import { getPrivateUserSafe, getUserSafe } from 'web/lib/supabase/users'
import { useWebsocketPrivateUser, useWebsocketUser } from 'web/hooks/use-user'
import { identifyUser, setUserProperty } from 'web/lib/service/analytics'
import { getCookie, setCookie } from 'web/lib/util/cookie'

// Either we haven't looked up the logged in user yet (undefined), or we know
// the user is not logged in (null), or we know the user is logged in.
export type AuthUser =
  | undefined
  | null
  | (UserAndPrivateUser & { authLoaded: boolean })
const CACHED_USER_KEY = 'CACHED_USER_KEY_V2'

export const ensureDeviceToken = () => {
  let deviceToken = safeLocalStorage?.getItem('device-token')
  if (!deviceToken) {
    deviceToken = randomString()
    safeLocalStorage?.setItem('device-token', deviceToken)
  }
  return deviceToken
}
const getAdminToken = () => {
  const key = 'TEST_CREATE_USER_KEY'
  const cookie = getCookie(key)
  if (cookie) return cookie.replace(/"/g, '')

  // For our convenience. If there's a token in local storage, set it as a cookie
  const localStorageToken = safeLocalStorage?.getItem(key)
  if (localStorageToken) {
    setCookie(key, localStorageToken.replace(/"/g, ''))
  }
  return localStorageToken?.replace(/"/g, '') ?? ''
}

export const AuthContext = createContext<AuthUser>(undefined)

export function AuthProvider(props: {
  children: ReactNode
  serverUser?: AuthUser
}) {
  const { children, serverUser } = props

  const [user, setUser] = useStateCheckEquality<User | undefined | null>(
    serverUser ? serverUser.user : serverUser
  )
  const [privateUser, setPrivateUser] = useStateCheckEquality<
    PrivateUser | undefined
  >(serverUser ? serverUser.privateUser : undefined)
  const [authLoaded, setAuthLoaded] = useState(false)

  const authUser = !user
    ? user
    : !privateUser
    ? privateUser
    : { user, privateUser, authLoaded }

  useEffect(() => {
    if (serverUser === undefined) {
      const cachedUser = safeLocalStorage?.getItem(CACHED_USER_KEY)
      const parsed = cachedUser ? JSON.parse(cachedUser) : undefined
      if (parsed) {
        setUser(parsed.user)
        setPrivateUser(parsed.privateUser)
        setAuthLoaded(false)
      } else setUser(undefined)
    }
  }, [serverUser])

  useEffect(() => {
    if (authUser) {
      // Persist to local storage, to reduce login blink next time.
      // Note: Cap on localStorage size is ~5mb
      safeLocalStorage?.setItem(CACHED_USER_KEY, JSON.stringify(authUser))
    } else if (authUser === null) {
      safeLocalStorage?.removeItem(CACHED_USER_KEY)
    }
  }, [authUser])

  const onAuthLoad = (user: User, privateUser: PrivateUser) => {
    setUser(user)
    setPrivateUser(privateUser)
    setAuthLoaded(true)
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const supabaseUserId = session.user.id

        const [user, privateUser] = await Promise.all([
          getUserSafe(supabaseUserId),
          getPrivateUserSafe(),
        ])

        if (!user || !privateUser) {
          const deviceToken = ensureDeviceToken()
          const adminToken = getAdminToken()

          const newUser = (await api('create-user', {
            deviceToken,
            adminToken,
          })) as UserAndPrivateUser

          onAuthLoad(newUser.user, newUser.privateUser)
        } else {
          onAuthLoad(user, privateUser)
        }
      } else {
        // User logged out; reset to null
        setUser(null)
        setPrivateUser(undefined)
        // Clear local storage only if we were signed in, otherwise we'll clear referral info
        if (safeLocalStorage?.getItem(CACHED_USER_KEY)) localStorage.clear()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const uid = authUser ? authUser.user.id : authUser
  const username = authUser?.user.username

  useEffect(() => {
    if (uid) {
      identifyUser(uid)
    } else if (uid === null) {
      identifyUser(null)
    }
  }, [uid])

  useEffect(() => {
    if (username != null) {
      setUserProperty('username', username)
    }
  }, [username])

  const listenUser = useWebsocketUser(uid ?? undefined)
  useEffectCheckEquality(() => {
    if (authLoaded && listenUser) setUser(listenUser)
  }, [authLoaded, listenUser])

  const listenPrivateUser = useWebsocketPrivateUser(uid ?? undefined)
  useEffectCheckEquality(() => {
    if (authLoaded && listenPrivateUser) setPrivateUser(listenPrivateUser)
  }, [authLoaded, listenPrivateUser])

  return (
    <AuthContext.Provider value={authUser}>{children}</AuthContext.Provider>
  )
}
