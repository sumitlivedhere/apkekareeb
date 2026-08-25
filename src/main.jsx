import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initRealtimeSubscriptions, hydrateFromDB } from './store/hyperlocalStore';
import { installGlobalMediaGuard } from './utils/globalMediaGuard';

// 1. Establish persistent WebSockets listener for live town feeds & threads
initRealtimeSubscriptions();

// 2. Hydrate existing database listings from PostgreSQL into store
hydrateFromDB();

//3 Activate global media shield across all 17 feeds
installGlobalMediaGuard();

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}