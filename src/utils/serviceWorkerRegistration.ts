/**
 * Service Worker Registration & Core Data Sync Helper
 */

export interface SWRegistrationConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export interface CoreDataPayload {
  businesses: unknown[];
  currentBusinessId: string;
  products: unknown[];
  categories: unknown[];
  tables: unknown[];
  cashiers: unknown[];
  lastUpdated: string;
}

export function registerServiceWorker(config?: SWRegistrationConfig): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('[SW] Service Worker registered successfully with scope:', registration.scope);

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available
                console.log('[SW] New version available, ready for offline update.');
                if (config && config.onUpdate) {
                  config.onUpdate(registration);
                }
              } else {
                // Content cached for offline use
                console.log('[SW] Content cached for offline use.');
                if (config && config.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn('[SW] Service Worker registration failed:', error);
        if (config && config.onError) {
          config.onError(error);
        }
      });
  });
}

/**
 * Sends a snapshot of core POS data (products, categories, tables, businesses)
 * to the Service Worker cache so it is available via /api/pos-core-data even when completely offline.
 */
export function syncCoreDataToServiceWorker(payload: CoreDataPayload): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // If controller is ready, post message directly
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_CORE_DATA',
      payload,
    });
  } else {
    // Wait for ready
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'CACHE_CORE_DATA',
          payload,
        });
      }
    }).catch((err) => {
      console.warn('[SW] Could not post core data to Service Worker:', err);
    });
  }
}

/**
 * Trigger immediate skipWaiting on the active registration
 */
export function skipWaitingServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
}
