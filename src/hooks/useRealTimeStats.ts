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

      // Don't log or show errors for cancelled requests or network failures
      if (
        errorMessage.includes("cancelled") ||
        errorMessage.includes("aborted") ||
        errorMessage.includes("Network connection failed")
      ) {
        if (import.meta.env.DEV) {
          console.debug("Stats request handled gracefully:", errorMessage);
        }
        return; // Don't update state if request was cancelled
      }

      // Silently handle all stats errors since we have fallback data
      setError(null);

      // Log only in development for debugging
      if (import.meta.env.DEV) {
        console.debug("Stats service using fallback data:", errorMessage);
      }

      // The statsService already provides fallback data, so we don't need to set it here
      // This catch block should rarely be reached due to improved error handling in statsService
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
    // Check if stats are disabled in development
    if (import.meta.env.VITE_DISABLE_STATS === 'true') {
      // Set fallback stats immediately and skip API calls
      setStats([
        {
          number: 45,
          suffix: "K+",
          label: "PDFs Processed",
          icon: icons.fileText,
        },
        {
          number: 12,
          suffix: "K+",
          label: "Happy Users",
          icon: icons.users,
        },
        {
          number: 167,
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
      setIsLoading(false);
      setLastUpdated(new Date());
      return;
    }

    // Initial fetch
    fetchStats();

    if (!autoRefresh) return;

    // Set up auto-refresh every 15 minutes (reduced frequency to reduce server load)
    const interval = setInterval(fetchStats, 15 * 60 * 1000);

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
