import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/readability.css'
import { installGlobalImageRecovery } from '@/lib/imageRecovery'

installGlobalImageRecovery()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
