// Favicon tool usage tracking utility

export class FaviconUsageTracker {
  private static async trackToolUsage(
    toolName: string,
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    try {
      const response = await fetch("/api/usage/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolUsed: toolName,
          toolCategory: "favicon",
          fileCount: 1,
          totalFileSize: fileSize,
          processingTime: processingTime,
          success: success,
          completed: true,
          screenTimeInSec: Math.floor(Date.now() / 1000) % 3600, // Simple screen time calculation
        }),
      });

      if (!response.ok) {
        console.warn("Failed to track favicon tool usage:", toolName);
      }
    } catch (error) {
      console.warn("Error tracking favicon tool usage:", error);
    }
  }

  // Track specific favicon tools
  static async trackImageToFavicon(
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage(
      "favicon-image-to-favicon",
      fileSize,
      processingTime,
      success,
    );
  }

  static async trackTextToFavicon(
    textLength: number = 100, // Approximate size for text
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage(
      "favicon-text-to-favicon",
      textLength,
      processingTime,
      success,
    );
  }

  static async trackEmojiToFavicon(
    emojiSize: number = 50, // Approximate size for emoji
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage(
      "favicon-emoji-to-favicon",
      emojiSize,
      processingTime,
      success,
    );
  }

  static async trackLogoToFavicon(
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage(
      "favicon-logo-to-favicon",
      fileSize,
      processingTime,
      success,
    );
  }

  static async trackFaviconGenerator(
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage(
      "favicon-generator",
      fileSize,
      processingTime,
      success,
    );
  }
}
