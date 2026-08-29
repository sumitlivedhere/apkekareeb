import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { initRealtimeSubscriptions, hydrateFromDB } from './store/hyperlocalStore';
import { installGlobalMediaGuard } from './utils/globalMediaGuard';
import { registerSW } from 'virtual:pwa-register';


// 🔄 Auto-update Service Worker in background immediately on new deploy
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onOfflineReady() {},
});

// ⚡ Check for updates when user opens/resumes the app
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      updateSW();
    }
  });

  window.addEventListener('focus', () => {
    updateSW();
  });

  // Automatically reload when new service worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// 1. Establish persistent WebSockets listener for live town feeds & threads
initRealtimeSubscriptions();

// 2. Hydrate existing database listings from PostgreSQL into store
hydrateFromDB();

// 3. Activate global media shield across all feeds
installGlobalMediaGuard();

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>
  );
}

import { LocationProvider } from './context/LocationContext';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LocationProvider>
        <App />
      </LocationProvider>
    </ThemeProvider>
  </React.StrictMode>,
);