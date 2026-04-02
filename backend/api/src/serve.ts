import { loadSecretsToEnv } from 'common/secrets'
import { log } from 'shared/utils'
import { METRIC_WRITER } from 'shared/monitoring/metric-writer'
import { listen as webSocketListen } from 'shared/websockets/server'

log('Api server starting up....')

METRIC_WRITER.start()

import { app } from './app'

const startupProcess = async () => {
  await loadSecretsToEnv()
  log('Secrets loaded.')

  const PORT = process.env.PORT ?? 8088
  const httpServer = app.listen(PORT, () => {
    log.info(`Serving API on port ${PORT}.`)
  })

  webSocketListen(httpServer, '/ws')
  log('Server started successfully')
}
startupProcess()
