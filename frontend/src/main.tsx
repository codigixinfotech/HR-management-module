import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Purge any stale service workers and caches on dev server to prevent route freezing
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
} else if (import.meta.env.PROD) {
  registerSW({
    onNeedRefresh() {
      toast.info('New E-HCM Platform update available!', {
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload(),
        },
      });
    },
    onOfflineReady() {
      toast.success('E-HCM Platform is ready for offline use!');
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />)
