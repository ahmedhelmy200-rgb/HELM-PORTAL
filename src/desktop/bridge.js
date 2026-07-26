const getTauriInvoke = () => {
  if (typeof window === 'undefined') return null
  return window.__TAURI__?.core?.invoke || window.__TAURI_INTERNALS__?.invoke || null
}

export function isDesktopRuntime() {
  return typeof getTauriInvoke() === 'function'
}

async function invoke(command, args = {}) {
  const runner = getTauriInvoke()
  if (!runner) throw new Error('Desktop runtime is not available')
  return runner(command, args)
}

export const desktopDb = {
  status: () => invoke('desktop_status'),
  cacheUpsert: (entity, recordId, data, dirty = false) =>
    invoke('cache_upsert', { entity, recordId, data, dirty }),
  cacheUpsertMany: (entity, rows, dirty = false) =>
    invoke('cache_upsert_many', { entity, rows, dirty }),
  cacheGet: (entity, recordId) => invoke('cache_get', { entity, recordId }),
  cacheList: (entity) => invoke('cache_list', { entity }),
  cacheDelete: (entity, recordId) => invoke('cache_delete', { entity, recordId }),
  cacheMarkClean: (entity, recordId) => invoke('cache_mark_clean', { entity, recordId }),
  enqueue: (operation, entity, recordId, payload = {}) =>
    invoke('outbox_enqueue', { operation, entity, recordId, payload }),
  outboxList: (limit = 100) => invoke('outbox_list', { limit }),
  outboxDone: (id) => invoke('outbox_mark_done', { id }),
  outboxFailed: (id, error) => invoke('outbox_mark_failed', { id, error: String(error || '') }),
  metaSet: (key, value) => invoke('meta_set', { key, value: String(value ?? '') }),
  metaGet: (key) => invoke('meta_get', { key }),
}

export function emitSyncStatus(detail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('helm:desktop-sync-status', { detail }))
}
