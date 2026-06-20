// Keep this file intentionally minimal.
// It preserves Electron context isolation and leaves the React app unchanged.
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.dataset.desktop = 'electron'
})
