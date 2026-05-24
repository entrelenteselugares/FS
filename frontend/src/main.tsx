import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initSentry } from './lib/sentry'
// @ts-expect-error - Import meta env may not be fully typed here
import { registerSW } from 'virtual:pwa-register'

initSentry();

// In dev mode, unregister any stale service workers to prevent HMR conflicts
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.unregister());
  });
}

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
