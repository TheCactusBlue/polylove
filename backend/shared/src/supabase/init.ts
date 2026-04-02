import pgPromise from 'pg-promise'
export { SupabaseClient } from 'common/supabase/utils'
import { metrics, log } from '../utils'
import { IDatabase, ITask } from 'pg-promise'
import { IClient } from 'pg-promise/typescript/pg-subset'
import { HOUR_MS } from 'common/util/time'
import { METRICS_INTERVAL_MS } from 'shared/monitoring/metric-writer'
import { getMonitoringContext } from 'shared/monitoring/context'
import { type IConnectionParameters } from 'pg-promise/typescript/pg-subset'

export const pgp = pgPromise({
  error(err: any, e: pgPromise.IEventContext) {
    log.error('pgPromise background error', {
      error: err,
      event: e,
    })
  },
  query() {
    const ctx = getMonitoringContext()
    if (ctx?.endpoint) {
      metrics.inc('pg/query_count', { endpoint: ctx.endpoint })
    } else if (ctx?.job) {
      metrics.inc('pg/query_count', { job: ctx.job })
    } else {
      metrics.inc('pg/query_count')
    }
  },
})

// This loses precision for large numbers (> 2^53). Beware fetching int8 columns with large values.
pgp.pg.types.setTypeParser(20, (value: any) => parseInt(value, 10))
pgp.pg.types.setTypeParser(1700, parseFloat) // Type Id 1700 = NUMERIC

export type SupabaseTransaction = ITask<{}>
export type SupabaseDirectClient = IDatabase<{}, IClient> | SupabaseTransaction

const newClient = (settings: IConnectionParameters) => {
  return pgp(settings)
}

// Use one connection to avoid WARNING: Creating a duplicate database object for the same connection.
let pgpDirect: IDatabase<{}, IClient> | null = null
export function createSupabaseDirectClient(
  instanceId?: string,
  password?: string
) {
  if (pgpDirect) return pgpDirect

  // Prefer a full connection string if provided
  const dbUrl = process.env.SUPABASE_DB_URL
  if (dbUrl) {
    const client = newClient({
      connectionString: dbUrl,
      query_timeout: HOUR_MS,
      max: 20,
    })
    attachPoolMetrics(client)
    return (pgpDirect = client)
  }

  // Fall back to constructing from instance ID + password
  instanceId = instanceId ?? process.env.SUPABASE_INSTANCE_ID
  if (!instanceId) {
    throw new Error(
      "Can't connect to Supabase; set SUPABASE_DB_URL or SUPABASE_INSTANCE_ID."
    )
  }
  password = password ?? process.env.SUPABASE_PASSWORD
  if (!password) {
    throw new Error(
      "Can't connect to Supabase; no SUPABASE_PASSWORD set."
    )
  }
  const client = newClient({
    host: 'aws-0-us-west-1.pooler.supabase.com',
    port: 5432,
    user: `postgres.${instanceId}`,
    password: password,
    database: 'postgres',
    query_timeout: HOUR_MS,
    max: 20,
  })
  attachPoolMetrics(client)
  return (pgpDirect = client)
}

function attachPoolMetrics(client: IDatabase<{}, IClient>) {
  const pool = client.$pool
  pool.on('connect', () => metrics.inc('pg/connections_established'))
  pool.on('remove', () => metrics.inc('pg/connections_terminated'))
  pool.on('acquire', () => metrics.inc('pg/connections_acquired'))
  pool.on('release', () => metrics.inc('pg/connections_released'))
  setInterval(() => {
    metrics.set('pg/pool_connections', pool.waitingCount, { state: 'waiting' })
    metrics.set('pg/pool_connections', pool.idleCount, { state: 'idle' })
    metrics.set('pg/pool_connections', pool.expiredCount, { state: 'expired' })
    metrics.set('pg/pool_connections', pool.totalCount, { state: 'total' })
  }, METRICS_INTERVAL_MS)
}

let shortTimeoutPgpClient: IDatabase<{}, IClient> | null = null
export const createShortTimeoutDirectClient = () => {
  if (shortTimeoutPgpClient) return shortTimeoutPgpClient

  const dbUrl = process.env.SUPABASE_DB_URL
  if (dbUrl) {
    shortTimeoutPgpClient = newClient({
      connectionString: dbUrl,
      query_timeout: 1000 * 30,
      max: 20,
    })
    return shortTimeoutPgpClient
  }

  shortTimeoutPgpClient = newClient({
    host: 'aws-0-us-west-1.pooler.supabase.com',
    port: 5432,
    user: `postgres.${process.env.SUPABASE_INSTANCE_ID}`,
    password: process.env.SUPABASE_PASSWORD,
    database: 'postgres',
    query_timeout: 1000 * 30,
    max: 20,
  })
  return shortTimeoutPgpClient
}

export const SERIAL_MODE = new pgp.txMode.TransactionMode({
  tiLevel: pgp.txMode.isolationLevel.serializable,
  readOnly: false,
  deferrable: false,
})
