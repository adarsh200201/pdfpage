interface ConversionSettings {
  pageFormat: "A4" | "A3" | "Letter" | "Legal";
  orientation: "portrait" | "landscape";
  printBackground: boolean;
  waitForNetworkIdle: boolean;
  margins: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
}

interface ConversionInput {
  type: "file" | "content" | "url";
  file?: File;
  htmlContent?: string;
  websiteUrl?: string;
}

interface ConversionResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
  details?: {
    originalSize?: number;
    pdfSize?: number;
    processingTime?: number;
    pageFormat?: string;
    orientation?: string;
  };
}

export class HtmlToPdfService {
  private static API_URL =
    import.meta.env.DEV
      ? "http://localhost:5000"
      : "";

  /**
   * Test if the backend route is accessible by making a minimal POST request
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log(
        "Testing backend connection to:",
        `${this.API_URL}/pdf/health`,
      );

      const response = await fetch(`${this.API_URL}/api/pdf/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Backend response status:", response.status);
      console.log("✅ Backend response type:", response.type);
      console.log("✅ Backend response ok:", response.ok);
      console.log("✅ Backend response headers:");
      response.headers.forEach((value, key) => {
        console.log(`   ${key}: ${value}`);
      });

      if (!response.ok) {
        console.error("❌ Backend returned error status:", response.status);
        console.error("❌ Status text:", response.statusText);
        return false;
      }

      console.log(
        "✅ Backend test successful - route is accessible and returned success",
      );
      return true;
    } catch (error) {
      console.error("❌ Backend connection test failed:", error);
      return false;
    }
  }

  /**
   * Client-side HTML to PDF conversion using html2canvas and jsPDF (fallback)
   */
  static async convertToPdfClientSide(
    input: ConversionInput,
    settings: ConversionSettings,
  ): Promise<ConversionResult> {
    try {
      // Dynamic imports for client-side libraries
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Create HTML content
      let htmlContent = "";
      if (input.type === "content") {
        htmlContent = input.htmlContent || "";
      } else if (input.type === "file" && input.file) {
        htmlContent = await input.file.text();
      } else if (input.type === "url" && input.websiteUrl) {
        // For URL, we can't fetch due to CORS, so show a message
        htmlContent = `
          <html>
            <body style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
              <h1>URL Conversion Not Available</h1>
              <p>Client-side URL conversion is not supported due to browser security restrictions.</p>
              <p>Requested URL: ${input.websiteUrl}</p>
              <p>Please copy the HTML content from the webpage and paste it directly.</p>
            </body>
          </html>
        `;
      }

      // Create a temporary container to render HTML
      const container = document.createElement("div");
      container.innerHTML = htmlContent;
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.width = settings.pageFormat === "A4" ? "794px" : "1024px";
      document.body.appendChild(container);

      try {
        // Convert HTML to canvas
        const canvas = await html2canvas(container, {
          width: parseInt(container.style.width),
          backgroundColor: settings.printBackground ? null : "#ffffff",
          scale: 2, // Higher quality
        });

        // Create PDF
        const imgData = canvas.toDataURL("image/jpeg", 0.8);
        const pdf = new jsPDF({
          orientation: settings.orientation,
          unit: "mm",
          format: settings.pageFormat.toLowerCase(),
        });

        const imgWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

        // Get PDF as blob
        const pdfBlob = pdf.output("blob");
        const timestamp = Date.now();
        const filename = `html-to-pdf-${timestamp}.pdf`;

        return {
          success: true,
          blob: pdfBlob,
          filename,
          details: {
            originalSize: htmlContent.length,
            pdfSize: pdfBlob.size,
            processingTime: 0,
            pageFormat: settings.pageFormat,
            orientation: settings.orientation,
          },
        };
      } finally {
        // Clean up
        document.body.removeChild(container);
      }
    } catch (error) {
      console.error("Client-side HTML to PDF conversion error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Convert HTML to PDF using the backend service
   */
  static async convertToPdf(
    input: ConversionInput,
    settings: ConversionSettings,
    sessionId?: string,
  ): Promise<ConversionResult> {
    try {
      // Validate input
      this.validateInput(input);

      // Prepare form data
      const formData = new FormData();

      // Add input based on type
      switch (input.type) {
        case "file":
          if (!input.file) {
            return { success: false, error: "File is required" };
          }
          formData.append("file", input.file);
          break;
        case "content":
          if (!input.htmlContent?.trim()) {
            return { success: false, error: "HTML content is required" };
          }
          formData.append("htmlContent", input.htmlContent);
          break;
        case "url":
          if (!input.websiteUrl?.trim()) {
            return { success: false, error: "Website URL is required" };
          }
          if (!this.isValidUrl(input.websiteUrl)) {
            return { success: false, error: "Invalid URL format" };
          }
          formData.append("url", input.websiteUrl);
          break;
      }

      // Add settings
      formData.append("pageFormat", settings.pageFormat);
      formData.append("orientation", settings.orientation);
      formData.append("printBackground", settings.printBackground.toString());
      formData.append(
        "waitForNetworkIdle",
        settings.waitForNetworkIdle.toString(),
      );
      formData.append("margins", JSON.stringify(settings.margins));

      if (sessionId) {
        formData.append("sessionId", sessionId);
      }

      // Make API request
      console.log("Making API request to:", `${this.API_URL}/pdf/html-to-pdf`);
      const response = await fetch(`${this.API_URL}/api/pdf/html-to-pdf`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        console.error("❌ Backend returned error status:", response.status);
        console.error("❌ Response status text:", response.statusText);
        console.error("❌ Response headers:");
        response.headers.forEach((value, key) => {
          console.error(`   ${key}: ${value}`);
        });

        // Return error result instead of throwing
        return {
          success: false,
          error: `Backend error: ${response.status} ${response.statusText || "Internal Server Error"}`,
        };
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Extract metadata from headers
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename =
        contentDisposition?.match(/filename="([^"]+)"/)?.[1] ||
        `html-to-pdf-${Date.now()}.pdf`;

      const details = {
        originalSize: parseInt(response.headers.get("X-Original-Size") || "0"),
        pdfSize: parseInt(response.headers.get("X-PDF-Size") || "0"),
        processingTime: parseInt(
          response.headers.get("X-Processing-Time") || "0",
        ),
        pageFormat:
          response.headers.get("X-Page-Format") || settings.pageFormat,
        orientation:
          response.headers.get("X-Orientation") || settings.orientation,
      };

      return {
        success: true,
        blob,
        filename,
        details,
      };
    } catch (error) {
      console.error("HTML to PDF conversion error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Download the converted PDF
   */
  static downloadPdf(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Validate conversion input
   */
  private static validateInput(input: ConversionInput) {
    if (input.type === "file") {
      if (!input.file) {
        throw new Error("File is required");
      }
      if (
        !input.file.name.toLowerCase().endsWith(".html") &&
        input.file.type !== "text/html"
      ) {
        throw new Error("Only HTML files are supported");
      }
      if (input.file.size > 10 * 1024 * 1024) {
        // 10MB limit
        throw new Error("File size must be less than 10MB");
      }
    } else if (input.type === "content") {
      if (!input.htmlContent?.trim()) {
        throw new Error("HTML content cannot be empty");
      }
      if (input.htmlContent.length > 1024 * 1024) {
        // 1MB limit for content
        throw new Error("HTML content is too large (max 1MB)");
      }
    } else if (input.type === "url") {
      if (!input.websiteUrl?.trim()) {
        throw new Error("Website URL cannot be empty");
      }
      if (!this.isValidUrl(input.websiteUrl)) {
        throw new Error("Invalid URL format");
      }
    }
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get suggested settings for different use cases
   */
  static getPresetSettings(
    preset: "web" | "print" | "mobile",
  ): ConversionSettings {
    const presets = {
      web: {
        pageFormat: "A4" as const,
        orientation: "portrait" as const,
        printBackground: true,
        waitForNetworkIdle: true,
        margins: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" },
      },
      print: {
        pageFormat: "A4" as const,
        orientation: "portrait" as const,
        printBackground: false,
        waitForNetworkIdle: true,
        margins: { top: "2cm", bottom: "2cm", left: "2cm", right: "2cm" },
      },
      mobile: {
        pageFormat: "A4" as const,
        orientation: "portrait" as const,
        printBackground: true,
        waitForNetworkIdle: true,
        margins: {
          top: "0.5cm",
          bottom: "0.5cm",
          left: "0.5cm",
          right: "0.5cm",
        },
      },
    };

    return presets[preset];
  }
}

export type { ConversionSettings, ConversionInput, ConversionResult };
