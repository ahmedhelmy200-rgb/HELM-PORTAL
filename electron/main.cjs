const { app, BrowserWindow, ipcMain, shell } = require('electron')
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { URL } = require('node:url')

const DESKTOP_HOST = '127.0.0.1'
const DESKTOP_PORT = 41735
const DESKTOP_ORIGIN = `http://${DESKTOP_HOST}:${DESKTOP_PORT}`
const OAUTH_CALLBACK_PATH = '/__helm_oauth_callback'
const OAUTH_CALLBACK_URL = `${DESKTOP_ORIGIN}${OAUTH_CALLBACK_PATH}`

app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu')

let mainWindow = null
let staticServer = null

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

function escapeHtml(value) {
  return String(value || '').replace(/[<>&"']/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

function oauthResultHtml({ ok, message }) {
  const title = ok ? 'تم تسجيل الدخول' : 'تعذر تسجيل الدخول'
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title} - HELM Portal</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#07111f;color:#fff;font-family:Tahoma,Arial,sans-serif;padding:24px;box-sizing:border-box}
    main{width:min(620px,100%);border:1px solid rgba(255,255,255,.14);border-radius:26px;padding:30px;background:rgba(255,255,255,.06);box-shadow:0 24px 90px rgba(0,0,0,.35);text-align:center}
    h1{margin:0 0 14px;font-size:28px}p{line-height:1.9;color:#dbeafe;margin:0}.ok{color:#86efac}.bad{color:#fca5a5}
  </style>
</head>
<body><main><h1 class="${ok ? 'ok' : 'bad'}">${title}</h1><p>${escapeHtml(message)}</p><p style="margin-top:18px">يمكنك إغلاق هذه الصفحة والعودة إلى برنامج HELM Portal.</p></main></body>
</html>`
}

function errorHtml(title, details) {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>HELM Portal</title><style>body{font-family:Tahoma,Arial;background:#0f172a;color:white;padding:40px}main{max-width:900px;margin:auto;background:#111c33;padding:28px;border-radius:24px}pre{direction:ltr;text-align:left;white-space:pre-wrap;background:#020617;padding:16px;border-radius:14px;color:#bfdbfe}</style></head><body><main><h1>${escapeHtml(title)}</h1><pre>${escapeHtml(details)}</pre></main></body></html>`
}

function sendOAuthPayload(payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('helm:oauth-callback', payload)
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function serveFile(res, filePath) {
  const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  })
  fs.createReadStream(filePath).pipe(res)
}

function startStaticServer() {
  const distDir = path.resolve(app.getAppPath(), 'dist')
  const indexPath = path.join(distDir, 'index.html')

  if (!fs.existsSync(indexPath)) {
    throw new Error(`Desktop build is missing dist/index.html at ${indexPath}`)
  }

  staticServer = http.createServer((req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', DESKTOP_ORIGIN)

      if (requestUrl.pathname === OAUTH_CALLBACK_PATH) {
        const code = requestUrl.searchParams.get('code') || ''
        const error = requestUrl.searchParams.get('error') || ''
        const errorDescription = requestUrl.searchParams.get('error_description') || ''
        const payload = { code, error, errorDescription }
        sendOAuthPayload(payload)

        const ok = Boolean(code) && !error
        const message = ok
          ? 'تم استلام موافقة Google بأمان، ويجري إكمال الجلسة داخل البرنامج.'
          : (errorDescription || error || 'لم يصل رمز تسجيل الدخول من Google.')
        res.writeHead(ok ? 200 : 400, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
        res.end(oauthResultHtml({ ok, message }))
        return
      }

      const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '') || 'index.html'
      const candidate = path.resolve(distDir, relativePath)
      const insideDist = candidate === distDir || candidate.startsWith(`${distDir}${path.sep}`)

      if (insideDist && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        serveFile(res, candidate)
        return
      }

      // BrowserRouter fallback: every application route serves index.html.
      serveFile(res, indexPath)
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(`HELM Desktop server error: ${error.message || error}`)
    }
  })

  return new Promise((resolve, reject) => {
    staticServer.once('error', reject)
    staticServer.listen(DESKTOP_PORT, DESKTOP_HOST, () => resolve(DESKTOP_ORIGIN))
  })
}

function registerIpc() {
  ipcMain.handle('helm:get-oauth-callback-url', () => OAUTH_CALLBACK_URL)
  ipcMain.handle('helm:open-external', async (_event, rawUrl) => {
    const parsed = new URL(String(rawUrl || ''))
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Blocked non-web external URL')
    await shell.openExternal(parsed.toString())
    return true
  })
}

function createWindow(startUrl) {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'HELM Portal',
    autoHideMenuBar: true,
    backgroundColor: '#f8fafc',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const target = new URL(url)
      if (target.origin !== DESKTOP_ORIGIN) {
        event.preventDefault()
        shell.openExternal(url)
      }
    } catch {}
  })

  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.control && input.shift && String(input.key || '').toLowerCase() === 'i') {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml('توقف محرك العرض داخل HELM Portal', JSON.stringify(details, null, 2)))}`)
  })

  mainWindow.loadURL(startUrl).catch((error) => {
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml('تعذر تشغيل HELM Portal', error.stack || error.message || String(error)))}`)
  })
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })

  app.whenReady().then(async () => {
    try {
      registerIpc()
      const startUrl = process.env.ELECTRON_START_URL || await startStaticServer()
      createWindow(startUrl)
    } catch (error) {
      const win = new BrowserWindow({ width: 920, height: 650, backgroundColor: '#0f172a' })
      win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml('فشل بدء نسخة سطح المكتب', error.stack || error.message || String(error)))}`)
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(process.env.ELECTRON_START_URL || DESKTOP_ORIGIN)
    })
  })
}

app.on('window-all-closed', () => {
  if (staticServer) {
    try { staticServer.close() } catch {}
    staticServer = null
  }
  if (process.platform !== 'darwin') app.quit()
})
