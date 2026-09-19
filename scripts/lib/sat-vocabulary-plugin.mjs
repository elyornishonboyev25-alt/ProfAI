import { syncSatVocabulary } from './sat-vocabulary-sync.mjs'

export function satVocabularyPlugin() {
  let root
  let mode
  let pending = Promise.resolve()
  const sync = () => {
    pending = pending.catch(() => {}).then(() => syncSatVocabulary(root, mode))
    return pending
  }
  return {
    name: 'sat-vocabulary-sync',
    enforce: 'pre',
    configResolved(config) { root = config.root; mode = config.mode },
    buildStart: sync,
    configureServer(server) {
      const changed = (path) => {
        const normalized = path.replace(/\\/g, '/')
        if (!/\/src\/(?:features\/sat\/|data\/sat\/|data\/satVocabulary\.ts$)/.test(normalized)) return
        void sync().catch((error) => {
          server.config.logger.error(error.message)
          server.ws.send({ type: 'error', err: { message: error.message, stack: '' } })
        })
      }
      server.watcher.on('change', changed).on('add', changed).on('unlink', changed)
      server.httpServer?.once('close', () => {
        server.watcher.off('change', changed).off('add', changed).off('unlink', changed)
      })
    },
  }
}
