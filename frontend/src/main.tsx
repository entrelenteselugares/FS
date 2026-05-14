import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initSentry } from './lib/sentry'
// @ts-ignore
import { registerSW } from 'virtual:pwa-register'

initSentry();
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
