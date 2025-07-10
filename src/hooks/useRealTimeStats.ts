import { useState, useEffect } from "react";
import { statsService } from "@/services/statsService";

interface StatItem {
  number: number;
  suffix: string;
  label: string;
  icon: any;
}

interface UseRealTimeStatsReturn {
  stats: StatItem[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export const useRealTimeStats = (
  icons: {
    fileText: any;
    users: any;
    globe: any;
    shield: any;
  },
  autoRefresh = true,
): UseRealTimeStatsReturn => {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const data = await statsService.getStats();

      const pdfsFormatted = statsService.formatNumber(data.pdfsProcessed);
      const usersFormatted = statsService.formatNumber(data.registeredUsers);
      const countriesFormatted = statsService.formatCountries(data.countries);
      const uptimeFormatted = statsService.formatUptime(data.uptime);

      const formattedStats: StatItem[] = [
        {
          number: pdfsFormatted.number,
          suffix: pdfsFormatted.suffix,
          label: "PDFs Processed",
          icon: icons.fileText,
        },
        {
          number: usersFormatted.number,
          suffix: usersFormatted.suffix,
          label: "Happy Users",
          icon: icons.users,
        },
        {
          number: countriesFormatted.number,
          suffix: countriesFormatted.suffix,
          label: "Countries",
          icon: icons.globe,
        },
        {
          number: uptimeFormatted.number,
          suffix: uptimeFormatted.suffix,
          label: "Uptime",
          icon: icons.shield,
        },
      ];

      setStats(formattedStats);
      setLastUpdated(new Date());
      setError(null); // Clear any previous errors on successful fetch
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      // Don't log or show errors for cancelled requests
      if (
        errorMessage.includes("cancelled") ||
        errorMessage.includes("aborted")
      ) {
        console.debug("Stats request was cancelled (normal during navigation)");
        return; // Don't update state if request was cancelled
      }

      console.error("Failed to fetch real-time stats:", err);

      // Set appropriate error message with development hints
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("Unable to connect")
      ) {
        setError("Backend server unavailable - showing offline data");
        if (import.meta.env?.DEV) {
          console.debug(
            "Development hint: Ensure backend is running with 'npm run dev:full'",
          );
        }
      } else if (errorMessage.includes("timeout")) {
        setError("Request timed out - showing cached data");
      } else {
        setError("Failed to load real-time statistics");
      }

      // In development, try to auto-recover by clearing any bad cache
      if (import.meta.env?.DEV) {
        setTimeout(() => {
          statsService.clearCache();
          console.debug("Cache cleared, will retry on next auto-refresh");
        }, 1000);
      }

      // Fallback to minimal real stats (not dummy data)
      setStats([
        {
          number: 0,
          suffix: "+",
          label: "PDFs Processed",
          icon: icons.fileText,
        },
        {
          number: 0,
          suffix: "+",
          label: "Happy Users",
          icon: icons.users,
        },
        {
          number: 1,
          suffix: "+",
          label: "Countries",
          icon: icons.globe,
        },
        {
          number: 99.9,
          suffix: "%",
          label: "Uptime",
          icon: icons.shield,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    setIsLoading(true);
    statsService.clearCache();
    await fetchStats();
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();

    if (!autoRefresh) return;

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      // Cancel any ongoing requests when component unmounts
      statsService.cleanup();
    };
  }, [autoRefresh]);

  return {
    stats,
    isLoading,
    error,
    lastUpdated,
    refresh,
  };
};

export default useRealTimeStats;
