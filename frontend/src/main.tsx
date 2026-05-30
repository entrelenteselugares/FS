import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initSentry } from './lib/sentry'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// @ts-expect-error - Import meta env may not be fully typed here
import { registerSW } from 'virtual:pwa-register'

initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutos de cache padrão
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// In dev mode, unregister any stale service workers to prevent HMR conflicts
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.unregister());
  });
}

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>,
)
