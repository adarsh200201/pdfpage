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
      console.log("🔄 Service worker update found");
      handleServiceWorkerUpdate(registration);
    });

    // Check if SW is already controlling the page
    if (navigator.serviceWorker.controller) {
      console.log("📱 Service worker is controlling the page");
    }

    return registration;
  } catch (error) {
    console.error("❌ Service worker registration failed:", error);
    return null;
  }
}

// Handle service worker updates
function handleServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
  const newWorker = registration.installing;

  if (!newWorker) return;

  newWorker.addEventListener("statechange", () => {
    if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
      // New version is available
      console.log("🎉 New app version available!");

      // Show update notification
      showUpdateNotification(() => {
        // User chose to update
        newWorker.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      });
    }
  });
}

// Show update notification to user
function showUpdateNotification(onUpdate: () => void) {
  // Create custom notification element
  const notification = document.createElement("div");
  notification.className = "pwa-update-notification";
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e5322d;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 300px;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="font-weight: 600; margin-bottom: 8px;">
        🎉 New version available!
      </div>
      <div style="font-size: 14px; margin-bottom: 12px; opacity: 0.9;">
        Click to update and get the latest features.
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="pwa-update-btn" style="
          background: white;
          color: #e5322d;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
        ">Update Now</button>
        <button id="pwa-dismiss-btn" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">Later</button>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Handle update button
  const updateBtn = notification.querySelector("#pwa-update-btn");
  updateBtn?.addEventListener("click", () => {
    notification.remove();
    onUpdate();
  });

  // Handle dismiss button
  const dismissBtn = notification.querySelector("#pwa-dismiss-btn");
  dismissBtn?.addEventListener("click", () => {
    notification.remove();
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

// PWA install prompt handling
export class PWAInstallManager {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;

  constructor() {
    this.init();
  }

  private init() {
    // Listen for install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("📱 PWA install prompt triggered");
      e.preventDefault();
      this.deferredPrompt = e as any;
      this.showInstallButton();
    });

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      console.log("🎉 PWA installed successfully");
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;
    });

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      this.isInstalled = true;
      console.log("📱 PWA is running in standalone mode");
    }
  }

  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log("📱 No install prompt available");
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;

      console.log("📱 User install choice:", choiceResult.outcome);

      if (choiceResult.outcome === "accepted") {
        this.deferredPrompt = null;
        return true;
      }

      return false;
    } catch (error) {
      console.error("📱 Install prompt failed:", error);
      return false;
    }
  }

  public isInstallable(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  private showInstallButton() {
    // Create floating install button
    if (document.getElementById("pwa-install-btn")) return;

    const installBtn = document.createElement("button");
    installBtn.id = "pwa-install-btn";
    installBtn.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #e5322d;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 50px;
        box-shadow: 0 4px 12px rgba(229, 50, 45, 0.3);
        cursor: pointer;
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: 600;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        📱 Install App
      </div>
    `;

    installBtn.addEventListener("click", () => {
      this.showInstallPrompt();
    });

    document.body.appendChild(installBtn);
  }

  private hideInstallButton() {
    const installBtn = document.getElementById("pwa-install-btn");
    if (installBtn) {
      installBtn.remove();
    }
  }
}

// PWA feature detection
export function getPWAFeatures() {
  return {
    serviceWorker: "serviceWorker" in navigator,
    installPrompt: "onbeforeinstallprompt" in window,
    notifications: "Notification" in window,
    backgroundSync:
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype,
    pushMessaging: "serviceWorker" in navigator && "PushManager" in window,
    offlineStorage: "caches" in window,
    webShare: "share" in navigator,
    fullscreen: "requestFullscreen" in document.documentElement,
    standalone: window.matchMedia("(display-mode: standalone)").matches,
  };
}

// Network status detection
export function getNetworkStatus() {
  return {
    online: navigator.onLine,
    connection:
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection,
  };
}

// Initialize PWA features
export function initializePWA() {
  console.log("🚀 Initializing PWA features...");

  const features = getPWAFeatures();
  console.log("📱 PWA Features:", features);

  // Register service worker
  registerServiceWorker();

  // Initialize install manager
  const installManager = new PWAInstallManager();

  // Network status monitoring
  window.addEventListener("online", () => {
    console.log("🌐 App is back online");
    document.body.classList.remove("offline");
  });

  window.addEventListener("offline", () => {
    console.log("📵 App is offline");
    document.body.classList.add("offline");
  });

  return {
    features,
    installManager,
    networkStatus: getNetworkStatus(),
  };
}

export default {
  registerServiceWorker,
  PWAInstallManager,
  getPWAFeatures,
  getNetworkStatus,
  initializePWA,
};
