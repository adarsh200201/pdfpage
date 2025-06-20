import { useAuth } from "@/contexts/AuthContext";

interface UsageData {
  toolUsed: string;
  fileSize: number;
  timestamp: Date;
}

export class UsageService {
  static async trackUsage(
    toolUsed: string,
    fileSize: number,
  ): Promise<boolean> {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        // For anonymous users, use localStorage
        const today = new Date().toDateString();
        const usageKey = `usage_${today}`;
        const dailyUsage = JSON.parse(localStorage.getItem(usageKey) || "[]");

        if (dailyUsage.length >= 3) {
          return false; // Free limit reached
        }

        dailyUsage.push({
          toolUsed,
          fileSize,
          timestamp: new Date().toISOString(),
        });

        localStorage.setItem(usageKey, JSON.stringify(dailyUsage));
        return true;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/usage/track`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            toolUsed,
            fileSize,
            timestamp: new Date(),
          }),
        },
      );

      return response.ok;
    } catch (error) {
      console.error("Error tracking usage:", error);
      return false;
    }
  }

  static getAnonymousUsageCount(): number {
    const today = new Date().toDateString();
    const usageKey = `usage_${today}`;
    const dailyUsage = JSON.parse(localStorage.getItem(usageKey) || "[]");
    return dailyUsage.length;
  }

  static getRemainingFreeUsage(): number {
    return Math.max(0, 3 - this.getAnonymousUsageCount());
  }
}
