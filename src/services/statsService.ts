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
  private readonly API_BASE = "https://pdfpage.onrender.com";

  async getStats(): Promise<StatsData> {
    // Return cached data if it's still fresh
    if (this.cache && Date.now() - this.lastFetch < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      // Fetch real stats from our dashboard endpoint
      const response = await fetch(`${this.API_BASE}/api/stats/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add timeout for better error handling
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("Backend returned unsuccessful response");
      }

      const backendStats = data.data;

      const stats: StatsData = {
        pdfsProcessed: backendStats.pdfsProcessed || 0,
        registeredUsers: backendStats.registeredUsers || 0,
        countries: backendStats.countries || 1,
        uptime: backendStats.uptime || 99.9,
      };

      // Update cache
      this.cache = stats;
      this.lastFetch = Date.now();

      return stats;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Provide more specific error logging
      if (error.name === "AbortError") {
        console.error("Stats API request timed out after 10 seconds");
      } else if (error.message.includes("Failed to fetch")) {
        console.error("Unable to connect to backend - is the server running?");
      } else {
        console.error("Failed to fetch real stats:", errorMessage);
      }

      // Return fallback stats (realistic starting values, not dummy data)
      return {
        pdfsProcessed: 0,
        registeredUsers: 0,
        countries: 1,
        uptime: 99.9,
      };
    }
  }

  // Clear cache to force fresh data fetch
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
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
