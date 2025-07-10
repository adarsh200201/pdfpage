// Debug utility for monitoring stats service issues
import { statsService } from "@/services/statsService";
import { errorTracker } from "@/utils/error-tracker";

interface DebugInfo {
  errors: Array<{ timestamp: Date; error: Error; stack?: string }>;
  abortErrors: Array<{ timestamp: Date; error: Error; stack?: string }>;
  cache: any;
  lastErrorTime: Date | null;
}

class StatsDebugger {
  getDebugInfo(): DebugInfo {
    const allErrors = errorTracker.getRecentErrors();
    const abortErrors = errorTracker.getAbortErrors();

    return {
      errors: allErrors,
      abortErrors: abortErrors,
      cache: (statsService as any).cache,
      lastErrorTime:
        abortErrors.length > 0
          ? abortErrors[abortErrors.length - 1].timestamp
          : null,
    };
  }

  logDebugInfo(): void {
    const info = this.getDebugInfo();

    console.group("📊 Stats Service Debug Info");
    console.log("Total errors:", info.errors.length);
    console.log("AbortErrors:", info.abortErrors.length);
    console.log("Cache status:", info.cache ? "Has cache" : "No cache");
    console.log("Last error time:", info.lastErrorTime);

    if (info.abortErrors.length > 0) {
      console.group("🚨 Recent AbortErrors:");
      info.abortErrors.slice(-5).forEach((err, index) => {
        console.log(
          `${index + 1}. ${err.timestamp.toISOString()}: ${err.error.message}`,
        );
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  testStatsService(): Promise<void> {
    console.log("🧪 Testing stats service...");
    return statsService
      .getStats()
      .then((stats) => {
        console.log("✅ Stats service working:", stats);
      })
      .catch((error) => {
        console.error("❌ Stats service failed:", error);
      });
  }

  clearDebugData(): void {
    errorTracker.clearErrors();
    statsService.clearCache();
    console.log("🧹 Debug data cleared");
  }
}

const statsDebugger = new StatsDebugger();

// Make it available globally in development
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as any).statsDebugger = statsDebugger;
  console.log("🔧 Stats debugger available as window.statsDebugger");
}

export { statsDebugger };
