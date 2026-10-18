/**
 * 🚀 Aapke Kareeb Live Version Guard
 * Checks for newly deployed builds on Vercel and ensures all clients sync automatically.
 */

const LOCAL_VERSION_KEY = 'aapkekareeb_deployed_version';

// Fallback build time if running in dev mode
const CURRENT_BUILD_VERSION =
  typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : Date.now().toString();

export async function checkForAppUpdates(onUpdateFound) {
  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!res.ok) return;

    const data = await res.json();
    const serverVersion = String(data.version || '').trim();

    const storedVersion = localStorage.getItem(LOCAL_VERSION_KEY) || CURRENT_BUILD_VERSION;

    // If server has a newer version than what this client currently runs
    if (serverVersion && serverVersion !== storedVersion && serverVersion > storedVersion) {
      localStorage.setItem(LOCAL_VERSION_KEY, serverVersion);

      // 1. Purge CacheStorage (clears any stale JS bundles from Service Workers)
      if ('caches' in window) {
        try {
          const cacheKeys = await window.caches.keys();
          await Promise.all(cacheKeys.map((k) => window.caches.delete(k)));
        } catch {}
      }

      // 2. Unregister or update old service workers
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
          }
        } catch {}
      }

      // 3. Trigger callback or auto-reload
      if (typeof onUpdateFound === 'function') {
        onUpdateFound();
      } else {
        window.location.reload(true);
      }
    } else if (!localStorage.getItem(LOCAL_VERSION_KEY)) {
      localStorage.setItem(LOCAL_VERSION_KEY, serverVersion || CURRENT_BUILD_VERSION);
    }
  } catch {
    // Silent fail if network drops
  }
}

export function initVersionGuard(onUpdateFound) {
  // Initial check on launch
  checkForAppUpdates(onUpdateFound);

  // Check whenever user brings app back to foreground on mobile
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForAppUpdates(onUpdateFound);
    }
  });

  // Check on network reconnect
  window.addEventListener('online', () => {
    checkForAppUpdates(onUpdateFound);
  });

  // Periodic background check every 60 seconds
  const intervalId = setInterval(() => {
    checkForAppUpdates(onUpdateFound);
  }, 60000);

  return () => clearInterval(intervalId);
}