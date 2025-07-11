import { errorTracker } from "@/utils/error-tracker";

interface StatsData {
  pdfsProcessed: number;
  registeredUsers: number;
  countries: number;
  uptime: number;
}

interface BackendStats {
  totalProcessed: number;
  totalUsers: number;
  countriesServed: number;
  systemUptime: number;
}

class StatsService {
  private cache: StatsData | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly API_BASE = import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://pdfpage-app.onrender.com";
  private currentController: AbortController | null = null;

  async getStats(): Promise<StatsData> {
    // Return cached data if it's still fresh
    if (this.cache && Date.now() - this.lastFetch < this.CACHE_DURATION) {
      return this.cache;
    }

    // Create a promise that will handle both timeout and fetch
    return new Promise((resolve) => {
      let isResolved = false;

      const resolveOnce = (data: StatsData) => {
        if (!isResolved) {
          isResolved = true;
          resolve(data);
        }
      };

      // Set timeout to return fallback stats after 3 seconds
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          console.warn(
            "Stats API request timed out after 3 seconds - using fallback stats",
          );
          resolveOnce(this.getFallbackStats());
        }
      }, 3000);

      // Attempt to fetch real stats
      this.fetchStatsFromAPI()
        .then((stats) => {
          clearTimeout(timeoutId);
          if (!isResolved) {
            // Update cache with real data
            this.cache = stats;
            this.lastFetch = Date.now();
            resolveOnce(stats);
          }
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          if (!isResolved) {
            // Only track/log real errors, not intentional aborts or cancellations
            if (
              error.name !== "AbortError" &&
              error.name !== "RequestCancelledError" &&
              error.message !== "Request was cancelled"
            ) {
              errorTracker.trackError(error, "statsService.getStats");
              this.logError(error);
            }
            resolveOnce(this.getFallbackStats());
          }
        });
    });
  }

  private async fetchStatsFromAPI(): Promise<StatsData> {
    // Cancel any existing request
    if (this.currentController) {
      this.currentController.abort();
    }

    const controller = new AbortController();
    this.currentController = controller;

    // Abort fetch after 2.5 seconds to ensure we don't exceed the main timeout
    const abortTimeoutId = setTimeout(() => {
      if (!controller.signal.aborted && this.currentController === controller) {
        console.debug("StatsService: Aborting request due to timeout");
        controller.abort();
      }
    }, 2500);

    try {
      const response = await fetch(`${this.API_BASE}/api/stats/dashboard`, {
        signal: controller.signal,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      clearTimeout(abortTimeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("Backend returned unsuccessful response");
      }

      const backendStats = data.data;

      return {
        pdfsProcessed: backendStats.pdfsProcessed || 0,
        registeredUsers: backendStats.registeredUsers || 0,
        countries: backendStats.countries || 1,
        uptime: backendStats.uptime || 99.9,
      };
    } catch (error) {
      clearTimeout(abortTimeoutId);

      // Handle AbortError gracefully - this is intentional cancellation
      if (error instanceof Error && error.name === "AbortError") {
        // Create a specific error type for cancelled requests
        const cancelError = new Error("Request was cancelled");
        cancelError.name = "RequestCancelledError";
        throw cancelError;
      }

      throw error;
    } finally {
      // Clear the controller reference
      if (this.currentController === controller) {
        this.currentController = null;
      }
    }
  }

  private getFallbackStats(): StatsData {
    const fallbackStats: StatsData = {
      pdfsProcessed: 45280 + Math.floor(Math.random() * 100),
      registeredUsers: 12840 + Math.floor(Math.random() * 10),
      countries: 167,
      uptime: 99.8,
    };

    // Cache fallback stats for a shorter duration
    this.cache = fallbackStats;
    this.lastFetch = Date.now() - this.CACHE_DURATION * 0.8; // Cache for 80% of normal duration

    return fallbackStats;
  }

  private logError(error: any): void {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Provide more specific error logging with debugging info
    if (error.name === "AbortError") {
      console.warn("Stats API request was aborted - using fallback stats");
    } else if (errorMessage.includes("Failed to fetch")) {
      console.warn(
        `Backend unavailable at ${this.API_BASE || "proxy"}/api/stats/dashboard - using fallback stats`,
      );
      if (import.meta.env.DEV) {
        console.debug(
          "Development hint: Check if backend is running on port 5000",
        );
      }
    } else {
      console.warn(
        "Failed to fetch real stats - using fallback:",
        errorMessage,
      );
      if (import.meta.env.DEV) {
        console.debug("Full error details:", error);
      }
    }
  }

  // Clear cache to force fresh data fetch
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }

  // Cancel any ongoing requests and cleanup
  cleanup(): void {
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
    this.clearCache();
  }

  // Format numbers for display (e.g., 1500000 -> 1.5M+)
  formatNumber(num: number): { number: number; suffix: string } {
    if (num >= 1000000) {
      return { number: Math.floor(num / 100000) / 10, suffix: "M+" };
    } else if (num >= 1000) {
      return { number: Math.floor(num / 100) / 10, suffix: "K+" };
    } else {
      return { number: num, suffix: "+" };
    }
  }

  // Format uptime percentage
  formatUptime(uptime: number): { number: number; suffix: string } {
    return { number: uptime, suffix: "%" };
  }

  // Format countries count
  formatCountries(countries: number): { number: number; suffix: string } {
    return { number: countries, suffix: "+" };
  }
}

export const statsService = new StatsService();
export default statsService;
