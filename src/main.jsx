import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/readability.css'
import '@/polish.css'
import { installGlobalImageRecovery } from '@/lib/imageRecovery'
import { installCaseResultSchemaFallback } from '@/lib/installCaseResultFallback'

installGlobalImageRecovery()
installCaseResultSchemaFallback()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
