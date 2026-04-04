// PWA utilities for service worker registration and app updates

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PWAUpdateInfo {
  isUpdateAvailable: boolean;
  registration?: ServiceWorkerRegistration;
  newWorker?: ServiceWorker;
}

// Service Worker registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.log("📱 Service workers not supported");
    return null;
  }

  try {
    console.log("📱 Registering service worker...");

    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none", // Always check for updates
    });

    console.log(
      "✅ Service worker registered successfully:",
      registration.scope,
    );

    // Check for updates
    registration.addEventListener("updatefound", () => {
      console.log("📱 Service worker update found");
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              console.log("📱 New content available, refresh to update");
              // Optionally show update notification
            } else {
              console.log("📱 Content cached for offline use");
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error("❌ Service worker registration failed:", error);
    return null;
  }
}

// Install prompt handling
export function setupInstallPrompt(): PWAInstallPrompt | null {
  let deferredPrompt: any = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    console.log("📱 Install prompt available");
    e.preventDefault();
    deferredPrompt = e;
  });

  if (deferredPrompt) {
    return {
      prompt: async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          return deferredPrompt.userChoice;
        }
      },
      userChoice: deferredPrompt.userChoice,
    };
  }

  return null;
}

// Check if running as PWA
export function isPWA(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

// Get PWA capabilities
export function getPWACapabilities() {
  return {
    serviceWorker: "serviceWorker" in navigator,
    notifications: "Notification" in window,
    pushMessaging: "PushManager" in window,
    backgroundSync:
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype,
    webShare: "share" in navigator,
    installPrompt: "BeforeInstallPromptEvent" in window,
    fullscreen: "requestFullscreen" in document.documentElement,
    offlineStorage: "caches" in window,
    standalone: isPWA(),
  };
}

// Initialize PWA features
export function initializePWA(): void {
  console.log("🚀 Initializing PWA features...");

  // In development, skip service worker to avoid cached bundles
  if (import.meta.env.DEV) {
    console.log(
      "🔧 PWA: Skipping service worker and install prompt in development to avoid caching issues.",
    );
    return;
  }

  const capabilities = getPWACapabilities();
  console.log("📱 PWA Features:", capabilities);

  // Register service worker (production only)
  registerServiceWorker();

  // Setup install prompt
  setupInstallPrompt();

  // Handle app installation
  window.addEventListener("appinstalled", (e) => {
    console.log("📱 App installed successfully");
  });

  // Handle visibility changes for background sync
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      console.log("📱 App became visible, checking for updates");
    }
  });

  console.log("✅ PWA initialization complete");
}

// Show install banner (if available)
export async function showInstallBanner(): Promise<boolean> {
  const installPrompt = setupInstallPrompt();

  if (installPrompt) {
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      return choice.outcome === "accepted";
    } catch (error) {
      console.error("❌ Install prompt failed:", error);
      return false;
    }
  }

  return false;
}

// Update service worker
export async function updateServiceWorker(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      registration.update();
      console.log("📱 Checking for service worker updates...");
    }
  }
}

// Clear caches (for troubleshooting)
export async function clearAllCaches(): Promise<void> {
  if ("caches" in window) {
    const cacheNames = await caches.keys();

    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

    console.log("🗑️ All caches cleared");
  }
}

// Development-only helper: fully disable existing service workers and caches
// This prevents stale cached React bundles from causing invalid hook errors in dev.
export async function unregisterDevServiceWorkers(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();

      if (registrations.length > 0) {
        console.log(
          "🧹 Dev: Unregistering",
          registrations.length,
          "existing service worker(s)...",
        );
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }
    }

    // Also clear caches to remove any old optimized bundles
    await clearAllCaches().catch(() => {
      // Non-fatal in dev
    });

    console.log("✅ Dev: Service workers and caches cleaned up");
  } catch (error) {
    console.warn("⚠️ Dev: Failed to fully unregister service workers:", error);
  }
}
