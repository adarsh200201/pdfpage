// Image tool usage tracking utility

export class ImageUsageTracker {
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
          toolCategory: "image",
          fileCount: 1,
          totalFileSize: fileSize,
          processingTime: processingTime,
          success: success,
          completed: true,
          screenTimeInSec: Math.floor(Date.now() / 1000) % 3600, // Simple screen time calculation
        }),
      });

      if (!response.ok) {
        console.warn("Failed to track image tool usage:", toolName);
      }
    } catch (error) {
      console.warn("Error tracking image tool usage:", error);
    }
  }

  // Track specific image tools
  static async trackCompress(
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage(
      "img-compress",
      fileSize,
      processingTime,
      success,
    );
  }

  static async trackConvert(
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage("img-convert", fileSize, processingTime, success);
  }

  static async trackCrop(
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage("img-crop", fileSize, processingTime, success);
  }

  static async trackMeme(
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage("img-meme", fileSize, processingTime, success);
  }

  static async trackJpgToPng(
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage(
      "img-jpg-to-png",
      fileSize,
      processingTime,
      success,
    );
  }

  static async trackPngToJpg(
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage(
      "img-png-to-jpg",
      fileSize,
      processingTime,
      success,
    );
  }

  static async trackResize(
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage("img-resize", fileSize, processingTime, success);
  }

  static async trackBackgroundRemoval(
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage(
      "img-background-removal",
      fileSize,
      processingTime,
      success,
    );
  }

  static async trackToPdf(
    fileSize: number,
    processingTime: number = 0,
    success: boolean = true,
  ): Promise<void> {
    await this.trackToolUsage("img-to-pdf", fileSize, processingTime, success);
  }
}
