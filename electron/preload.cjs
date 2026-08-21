const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('helmDesktop', {
  isDesktop: true,
  getOAuthCallbackUrl: () => ipcRenderer.invoke('helm:get-oauth-callback-url'),
  openExternal: (url) => ipcRenderer.invoke('helm:open-external', url),
  onOAuthCallback: (handler) => {
    if (typeof handler !== 'function') return () => {}
    const listener = (_event, payload) => handler(payload || {})
    ipcRenderer.on('helm:oauth-callback', listener)
    return () => ipcRenderer.removeListener('helm:oauth-callback', listener)
  },
})
