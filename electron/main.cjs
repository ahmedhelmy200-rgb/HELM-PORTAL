const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

// Some Windows machines show a black Electron window because of GPU acceleration/driver issues.
// Disable GPU acceleration for a safer desktop build.
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu')

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL

function errorHtml(title, details) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>HELM Portal - Desktop Error</title>
  <style>
    body{margin:0;font-family:Tahoma,Arial,sans-serif;background:#0f172a;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
    main{max-width:860px;width:100%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);border-radius:22px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.35)}
    h1{margin:0 0 14px;font-size:26px;color:#fecaca}
    p{line-height:1.9;color:#dbeafe}
    pre{direction:ltr;text-align:left;white-space:pre-wrap;background:#020617;color:#bfdbfe;border-radius:14px;padding:16px;overflow:auto;border:1px solid rgba(255,255,255,.12)}
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>تعذر تحميل واجهة HELM Portal داخل برنامج سطح المكتب. أرسل نص الخطأ أدناه للمراجعة.</p>
    <pre>${String(details || '').replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</pre>
  </main>
</body>
</html>`
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
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
      sandbox: false,
    },
  })

  win.once('ready-to-show', () => win.show())

  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      win.webContents.openDevTools({ mode: 'detach' })
    }
  })

  win.webContents.on('render-process-gone', (_event, details) => {
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml('توقف محرك العرض داخل البرنامج', JSON.stringify(details, null, 2))))
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    win.loadURL(process.env.ELECTRON_START_URL || 'http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html')
    if (!fs.existsSync(indexPath)) {
      win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml('ملف التشغيل غير موجود', indexPath)))
      return
    }

    win.loadFile(indexPath).catch((error) => {
      win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml('فشل تحميل ملف التطبيق', error.stack || error.message || String(error))))
    })
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
