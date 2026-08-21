import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner'
import './index.css'
import App from './App.tsx'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
