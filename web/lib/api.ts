import { API, APIParams, APIPath } from 'common/api/schema'
import { typedAPICall } from 'common/util/api'
import { sleep } from 'common/util/time'
import { db } from 'web/lib/supabase/db'
export { APIError } from 'common/api/utils'

export async function api<P extends APIPath>(
  path: P,
  params: APIParams<P> = {}
) {
  // If the api is authed and the user is not loaded, wait for the session.
  if (API[path].authed) {
    const {
      data: { session },
    } = await db.auth.getSession()
    if (!session) {
      let i = 0
      let currentSession = session
      while (!currentSession) {
        i++
        await sleep(i * 10)
        if (i > 10) {
          console.error('User session did not load after 10 iterations')
          break
        }
        const { data } = await db.auth.getSession()
        currentSession = data.session
      }
      return typedAPICall(path, params, currentSession)
    }
    return typedAPICall(path, params, session)
  }

  return typedAPICall(path, params, null)
}

function curriedAPI<P extends APIPath>(path: P) {
  return (params: APIParams<P>) => api(path, params)
}

export const updateLover = curriedAPI('update-lover')
export const updateUser = curriedAPI('me/update')
export const report = curriedAPI('report')
