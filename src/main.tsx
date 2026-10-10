import 'katex/dist/katex.min.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const serviceWorkerUrl = new URL('sw.js', document.baseURI).toString()
    navigator.serviceWorker.register(serviceWorkerUrl).catch((error: unknown) => {
      console.warn('Edvora: service worker registration failed', error)
      window.dispatchEvent(new Event('edvora-offline-error'))
    })
  })
}
