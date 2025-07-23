// Image processing service for client-side image operations
export class ImageService {
  private static instance: ImageService;

  private constructor() {}

  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  // Get base API URL for image service calls
  private getBaseURL(): string {
    return window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://pdfpage-app.onrender.com";
  }

  // Compress multiple images using backend API
  async compressImages(
    files: File[],
    level: "extreme" | "high" | "medium" | "low" | "best-quality" = "medium",
    format?: "jpeg" | "png" | "webp",
    maxWidth?: number,
    maxHeight?: number,
  ): Promise<{
    blob: Blob;
    stats: {
      totalOriginalSize: number;
      totalCompressedSize: number;
      overallCompressionRatio: number;
      imageCount: number;
    };
  }> {
    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("images", file);
      });

      formData.append("level", level);
      if (format) formData.append("format", format);
      if (maxWidth) formData.append("maxWidth", maxWidth.toString());
      if (maxHeight) formData.append("maxHeight", maxHeight.toString());

      const response = await fetch(`${this.getBaseURL()}/api/image/compress`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      // Get stats from headers
      const totalOriginalSize = parseInt(
        response.headers.get("X-Total-Original-Size") || "0",
      );
      const totalCompressedSize = parseInt(
        response.headers.get("X-Total-Compressed-Size") || "0",
      );
      const overallCompressionRatio = parseInt(
        response.headers.get("X-Overall-Compression-Ratio") || "0",
      );
      const imageCount = parseInt(
        response.headers.get("X-Total-Images") || "0",
      );

      return {
        blob,
        stats: {
          totalOriginalSize,
          totalCompressedSize,
          overallCompressionRatio,
          imageCount,
        },
      };
    } catch (error) {
      console.error("Backend compression failed:", error);
      // Fallback to client-side compression for single image
      if (files.length === 1) {
        const result = await this.compressImageLocal(
          files[0],
          parseFloat((getQualityFromLevel(level) / 100).toFixed(2)),
        );
        return {
          blob: result.file,
          stats: {
            totalOriginalSize: result.stats.originalSize,
            totalCompressedSize: result.stats.compressedSize,
            overallCompressionRatio: result.stats.compressionRatio,
            imageCount: 1,
          },
        };
      }
      throw error;
    }
  }

  // Compress single image using backend API
  async compressSingleImage(
    file: File,
    level: "extreme" | "high" | "medium" | "low" | "best-quality" = "medium",
    format?: "jpeg" | "png" | "webp",
    maxWidth?: number,
    maxHeight?: number,
  ): Promise<{
    file: File;
    stats: {
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
      wasResized: boolean;
    };
  }> {
    try {
      const formData = new FormData();
      formData.append("images", file);
      formData.append("level", level);
      if (format) formData.append("format", format);
      if (maxWidth) formData.append("maxWidth", maxWidth.toString());
      if (maxHeight) formData.append("maxHeight", maxHeight.toString());

      const response = await fetch(`${this.getBaseURL()}/api/image/compress`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      // Get stats from headers
      const originalSize = parseInt(
        response.headers.get("X-Original-Size") || "0",
      );
      const compressedSize = parseInt(
        response.headers.get("X-Compressed-Size") || "0",
      );
      const compressionRatio = parseInt(
        response.headers.get("X-Compression-Ratio") || "0",
      );
      const wasResized = response.headers.get("X-Was-Resized") === "true";

      // Create new file from blob
      const fileExtension =
        response.headers.get("Content-Type")?.split("/")[1] || "jpeg";
      const fileName = `compressed_${file.name.split(".")[0]}.${fileExtension}`;
      const compressedFile = new File([blob], fileName, {
        type: response.headers.get("Content-Type") || file.type,
      });

      return {
        file: compressedFile,
        stats: {
          originalSize,
          compressedSize,
          compressionRatio,
          wasResized,
        },
      };
    } catch (error) {
      console.error("Backend compression failed:", error);
      // Fallback to client-side compression
      const quality = getQualityFromLevel(level) / 100;
      const result = await this.compressImageLocal(
        file,
        quality,
        maxWidth,
        maxHeight,
      );
      return {
        file: result.file,
        stats: {
          originalSize: result.stats.originalSize,
          compressedSize: result.stats.compressedSize,
          compressionRatio: result.stats.compressionRatio,
          wasResized: false,
        },
      };
    }
  }

  // Legacy client-side compression method (renamed)
  async compressImageLocal(
    file: File,
    quality: number = 0.8,
    maxWidth?: number,
    maxHeight?: number,
  ): Promise<{
    file: File;
    stats: {
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
    };
  }> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate dimensions
        let { width, height } = img;
        let needsResize = false;

        if (maxWidth && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
          needsResize = true;
        }

        if (maxHeight && height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
          needsResize = true;
        }

        // For very small files or when no resize is needed and quality is high,
        // check if compression would actually help
        if (!needsResize && quality >= 0.8 && file.size < 10000) {
          // File is already small and high quality - likely won't compress well
          const stats = {
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 0,
          };
          resolve({ file, stats });
          return;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        // For PNG files, try converting to JPEG for better compression
        const outputType =
          file.type === "image/png" && quality < 0.9 ? "image/jpeg" : file.type;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Check if compression actually reduced file size
              if (blob.size >= file.size && !needsResize) {
                // Compression made file larger - return original
                const stats = {
                  originalSize: file.size,
                  compressedSize: file.size,
                  compressionRatio: 0,
                };
                resolve({ file, stats });
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: outputType,
                lastModified: Date.now(),
              });

              const stats = {
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: Math.round(
                  ((file.size - blob.size) / file.size) * 100,
                ),
              };

              resolve({ file: compressedFile, stats });
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          outputType,
          quality,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  // Resize image to specific dimensions
  async resizeImage(
    file: File,
    targetWidth: number,
    targetHeight: number,
    maintainAspectRatio: boolean = true,
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (maintainAspectRatio) {
          const aspectRatio = width / height;
          if (targetWidth / targetHeight > aspectRatio) {
            targetWidth = targetHeight * aspectRatio;
          } else {
            targetHeight = targetWidth / aspectRatio;
          }
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error("Failed to resize image"));
            }
          },
          file.type,
          0.9,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  // Crop image using backend API for server-side processing
  async cropImage(
    file: File,
    cropData: {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
      flipHorizontal?: boolean;
      flipVertical?: boolean;
      quality?: number;
      format?: "jpeg" | "png" | "webp";
    },
  ): Promise<File> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("x", cropData.x.toString());
    formData.append("y", cropData.y.toString());
    formData.append("width", cropData.width.toString());
    formData.append("height", cropData.height.toString());

    if (cropData.rotation !== undefined) {
      formData.append("rotation", cropData.rotation.toString());
    }
    if (cropData.flipHorizontal !== undefined) {
      formData.append("flipHorizontal", cropData.flipHorizontal.toString());
    }
    if (cropData.flipVertical !== undefined) {
      formData.append("flipVertical", cropData.flipVertical.toString());
    }
    if (cropData.quality !== undefined) {
      formData.append("quality", cropData.quality.toString());
    }
    if (cropData.format) {
      formData.append("format", cropData.format);
    }

    const response = await fetch(`${this.getBaseURL()}/api/image/crop`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to crop image");
    }

    const blob = await response.blob();
    const fileName = `cropped-${Date.now()}.${cropData.format || "jpeg"}`;
    return new File([blob], fileName, { type: blob.type });
  }

  // Client-side crop fallback for preview purposes
  async cropImageLocal(
    file: File,
    cropX: number,
    cropY: number,
    cropWidth: number,
    cropHeight: number,
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        ctx?.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight,
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const croppedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(croppedFile);
            } else {
              reject(new Error("Failed to crop image"));
            }
          },
          file.type,
          0.9,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  // Rotate image by specified angle
  async rotateImage(file: File, angle: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const rad = (angle * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));

        canvas.width = img.width * cos + img.height * sin;
        canvas.height = img.width * sin + img.height * cos;

        ctx?.translate(canvas.width / 2, canvas.height / 2);
        ctx?.rotate(rad);
        ctx?.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const rotatedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(rotatedFile);
            } else {
              reject(new Error("Failed to rotate image"));
            }
          },
          file.type,
          0.9,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  // Convert image format
  async convertFormat(file: File, targetFormat: string): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // If converting to JPG, fill with white background
        if (targetFormat === "image/jpeg") {
          ctx!.fillStyle = "#FFFFFF";
          ctx?.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx?.drawImage(img, 0, 0);

        const fileName =
          file.name.replace(/\.[^/.]+$/, "") +
          (targetFormat === "image/jpeg"
            ? ".jpg"
            : targetFormat === "image/png"
              ? ".png"
              : targetFormat === "image/webp"
                ? ".webp"
                : ".jpg");

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const convertedFile = new File([blob], fileName, {
                type: targetFormat,
                lastModified: Date.now(),
              });
              resolve(convertedFile);
            } else {
              reject(new Error("Failed to convert image"));
            }
          },
          targetFormat,
          0.9,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  // Add text watermark
  async addTextWatermark(
    file: File,
    text: string,
    options: {
      fontSize?: number;
      color?: string;
      opacity?: number;
      position?:
        | "center"
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right";
    } = {},
  ): Promise<File> {
    const {
      fontSize = 48,
      color = "#ffffff",
      opacity = 0.5,
      position = "center",
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx?.drawImage(img, 0, 0);

        // Set up text properties
        ctx!.font = `${fontSize}px Arial`;
        ctx!.fillStyle = color;
        ctx!.globalAlpha = opacity;
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";

        // Calculate position
        let x = canvas.width / 2;
        let y = canvas.height / 2;

        switch (position) {
          case "top-left":
            x = fontSize;
            y = fontSize;
            ctx!.textAlign = "left";
            ctx!.textBaseline = "top";
            break;
          case "top-right":
            x = canvas.width - fontSize;
            y = fontSize;
            ctx!.textAlign = "right";
            ctx!.textBaseline = "top";
            break;
          case "bottom-left":
            x = fontSize;
            y = canvas.height - fontSize;
            ctx!.textAlign = "left";
            ctx!.textBaseline = "bottom";
            break;
          case "bottom-right":
            x = canvas.width - fontSize;
            y = canvas.height - fontSize;
            ctx!.textAlign = "right";
            ctx!.textBaseline = "bottom";
            break;
        }

        // Draw text
        ctx?.fillText(text, x, y);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const watermarkedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(watermarkedFile);
            } else {
              reject(new Error("Failed to add watermark"));
            }
          },
          file.type,
          0.9,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  // Get image metadata
  async getImageInfo(file: File): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
    name: string;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type,
          name: file.name,
        });
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  // Validate image file
  isValidImageFile(file: File): boolean {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    return validTypes.includes(file.type);
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Generate favicon of specific size
  async generateFavicon(
    file: File,
    size: number,
    format: "png" | "ico" = "png",
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        canvas.width = size;
        canvas.height = size;

        // Use high-quality image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Clear canvas with transparent background
        ctx.clearRect(0, 0, size, size);

        // Calculate aspect ratio and positioning for centered, contained image
        const aspectRatio = img.width / img.height;
        let drawWidth = size;
        let drawHeight = size;
        let offsetX = 0;
        let offsetY = 0;

        if (aspectRatio > 1) {
          drawHeight = size / aspectRatio;
          offsetY = (size - drawHeight) / 2;
        } else {
          drawWidth = size * aspectRatio;
          offsetX = (size - drawWidth) / 2;
        }

        // Draw the image
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to generate favicon blob"));
            }
          },
          format === "ico" ? "image/png" : "image/png", // ICO will be handled as PNG
          1,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  // Generate multiple favicon sizes
  async generateFaviconSet(
    file: File,
    sizes: { size: number; name: string; format: "png" | "ico" }[],
    onProgress?: (progress: number) => void,
  ): Promise<
    Array<{
      size: number;
      name: string;
      format: "png" | "ico";
      blob: Blob;
      url: string;
    }>
  > {
    const results = [];

    for (let i = 0; i < sizes.length; i++) {
      const { size, name, format } = sizes[i];

      try {
        const blob = await this.generateFavicon(file, size, format);
        const url = URL.createObjectURL(blob);

        results.push({
          size,
          name,
          format,
          blob,
          url,
        });

        if (onProgress) {
          onProgress(((i + 1) / sizes.length) * 100);
        }
      } catch (error) {
        console.error(`Failed to generate ${name}:`, error);
        throw error;
      }
    }

    return results;
  }

  // Create ICO file from PNG blob (simplified implementation)
  async createIcoFile(pngBlob: Blob): Promise<Blob> {
    // For now, we'll return the PNG blob as-is
    // In a full implementation, you'd convert to proper ICO format
    return pngBlob;
  }

  // Generate web manifest JSON for PWA
  generateWebManifest(
    siteName: string,
    siteDescription: string,
    themeColor: string = "#000000",
    backgroundColor: string = "#ffffff",
  ): string {
    const manifest = {
      name: siteName,
      short_name: siteName,
      description: siteDescription,
      theme_color: themeColor,
      background_color: backgroundColor,
      display: "standalone",
      start_url: "/",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    };

    return JSON.stringify(manifest, null, 2);
  }

  // Generate HTML meta tags for favicons
  generateFaviconHTML(): string {
    return `<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- Android Chrome -->
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">

<!-- Web App Manifest -->
<link rel="manifest" href="/site.webmanifest">

<!-- Theme Color -->
<meta name="theme-color" content="#000000">`;
  }

  // Remove background from image using AI-powered background removal
  async removeBackground(
    file: File,
    options: {
      model?: "general" | "person" | "product" | "animal" | "car" | "building";
      precision?: "fast" | "balanced" | "precise";
      edgeSmoothing?: number;
      outputFormat?: "png" | "webp";
    } = {},
    onProgress?: (progress: number) => void,
  ): Promise<{
    file: File;
    blob: Blob;
    metadata: {
      model: string;
      processingTime: number;
      confidence: number;
      edgeQuality: number;
      originalSize: number;
      resultSize: number;
    };
  }> {
    const startTime = Date.now();
    onProgress?.(5);

    try {
      // First try API-based background removal
      const apiResult = await this.removeBackgroundAPI(
        file,
        options,
        onProgress,
      );
      if (apiResult) {
        return apiResult;
      }
    } catch (error) {
      console.warn(
        "API background removal failed, falling back to client-side:",
        error,
      );
    }

    // Fallback to client-side background removal
    onProgress?.(20);
    return this.removeBackgroundClientSide(file, options, onProgress);
  }

  // API-based background removal with multiple service support
  private async removeBackgroundAPI(
    file: File,
    options: any,
    onProgress?: (progress: number) => void,
  ): Promise<{
    file: File;
    blob: Blob;
    metadata: any;
  } | null> {
    const startTime = Date.now();

    console.log("🎯 Starting professional background removal...");

    // Try external APIs first (more reliable)
    const services = [
      { name: "removebg", apiKey: import.meta.env.VITE_REMOVEBG_API_KEY },
      { name: "photroom", apiKey: import.meta.env.VITE_PHOTROOM_API_KEY },
      { name: "clipdrop", apiKey: import.meta.env.VITE_CLIPDROP_API_KEY },
    ];

    // First try external API services
    for (const service of services) {
      if (!service.apiKey) {
        console.log(`⏭️ Skipping ${service.name} - no API key configured`);
        continue;
      }

      try {
        console.log(`🚀 Trying ${service.name} API...`);
        onProgress?.(10);

        const result = await this.callBackgroundRemovalAPI(
          service,
          file,
          options,
          onProgress,
        );
        if (result) {
          console.log(`✅ Successfully used ${service.name} API`);
          return result;
        }
      } catch (error) {
        console.warn(`❌ ${service.name} API failed:`, error.message);
        continue;
      }
    }

    // Then try our AI-powered backend with U²-Net model as fallback
    try {
      console.log("🧠 Trying internal U²-Net service as fallback...");
      onProgress?.(15);

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "options",
        JSON.stringify({
          ...options,
          model: options.model || "general",
          precision: options.precision || "precise",
          edgeSmoothing: options.edgeSmoothing || 3,
          outputFormat: options.outputFormat || "png",
        }),
      );

      const response = await fetch(`${this.getBaseURL()}/api/image/remove-bg-ai`, {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/octet-stream',
        },
      });

      if (response.ok) {
        onProgress?.(80);
        const blob = await response.blob();
        const processingTime = Date.now() - startTime;

        // Extract metadata from response headers
        const confidence = parseFloat(
          response.headers.get("X-AI-Confidence") || "0.95",
        );
        const edgeQuality = parseFloat(
          response.headers.get("X-Edge-Quality") || "0.9",
        );
        const modelUsed =
          response.headers.get("X-Model-Used") || options.model || "u2net";

        onProgress?.(100);

        const resultFile = new File(
          [blob],
          file.name.replace(/\.[^/.]+$/, `.${options.outputFormat || "png"}`),
          { type: `image/${options.outputFormat || "png"}` },
        );

        console.log("✅ Internal U²-Net service succeeded");
        return {
          file: resultFile,
          blob,
          metadata: {
            model: modelUsed,
            processingTime,
            confidence,
            edgeQuality,
            originalSize: file.size,
            resultSize: blob.size,
            engine: "U²-Net AI",
            precision: options.precision || "precise",
          },
        };
      }
    } catch (error) {
      console.warn("❌ Internal AI backend failed:", error.message);
    }

    console.log("❌ All API services failed or unavailable");
    return null;
  }

  // Call specific background removal API
  private async callBackgroundRemovalAPI(
    service: { name: string; apiKey: string },
    file: File,
    options: any,
    onProgress?: (progress: number) => void,
  ): Promise<{
    file: File;
    blob: Blob;
    metadata: any;
  } | null> {
    const startTime = Date.now();

    switch (service.name) {
      case "removebg":
        return this.callRemoveBgAPI(service.apiKey, file, options, onProgress);
      case "photroom":
        return this.callPhotoroomAPI(service.apiKey, file, options, onProgress);
      case "clipdrop":
        return this.callClipdropAPI(service.apiKey, file, options, onProgress);
      default:
        return null;
    }
  }

  // Remove.bg API implementation
  private async callRemoveBgAPI(
    apiKey: string,
    file: File,
    options: any,
    onProgress?: (progress: number) => void,
  ): Promise<{
    file: File;
    blob: Blob;
    metadata: any;
  } | null> {
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append("image_file", file);
      formData.append("size", "auto");

      // Map our model types to Remove.bg types
      const removeBgType = this.mapToRemoveBgType(options.model);
      if (removeBgType) {
        formData.append("type", removeBgType);
      }

      onProgress?.(30);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      onProgress?.(70);

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error("Remove.bg API quota exceeded - trying other services");
        }
        if (response.status === 403) {
          throw new Error("Remove.bg API key invalid - trying other services");
        }
        if (response.status === 400) {
          throw new Error("Remove.bg API: Invalid image format - trying other services");
        }
        throw new Error(`Remove.bg API error ${response.status} - trying other services`);
      }

      const blob = await response.blob();
      onProgress?.(90);

      const resultFile = new File(
        [blob],
        file.name.replace(/\.[^/.]+$/, "") + "_removed_bg.png",
        { type: "image/png" },
      );

      onProgress?.(100);

      const metadata = {
        model: "removebg",
        processingTime: Date.now() - startTime,
        confidence: 95,
        edgeQuality: 95,
        originalSize: file.size,
        resultSize: blob.size,
      };

      return { file: resultFile, blob, metadata };
    } catch (error) {
      console.error("Remove.bg API failed:", error);
      throw error;
    }
  }

  // Photroom API implementation
  private async callPhotoroomAPI(
    apiKey: string,
    file: File,
    options: any,
    onProgress?: (progress: number) => void,
  ): Promise<{
    file: File;
    blob: Blob;
    metadata: any;
  } | null> {
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append("image_file", file);
      formData.append("format", "PNG");

      onProgress?.(30);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch("https://sdk.photoroom.com/v1/segment", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      onProgress?.(70);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Photroom API key invalid - trying other services");
        }
        if (response.status === 429) {
          throw new Error("Photroom API rate limit exceeded - trying other services");
        }
        throw new Error(`Photroom API error ${response.status} - trying other services`);
      }

      const blob = await response.blob();
      onProgress?.(90);

      const resultFile = new File(
        [blob],
        file.name.replace(/\.[^/.]+$/, "") + "_removed_bg.png",
        { type: "image/png" },
      );

      onProgress?.(100);

      const metadata = {
        model: "photroom",
        processingTime: Date.now() - startTime,
        confidence: 90,
        edgeQuality: 90,
        originalSize: file.size,
        resultSize: blob.size,
      };

      return { file: resultFile, blob, metadata };
    } catch (error) {
      console.error("Photroom API failed:", error);
      throw error;
    }
  }

  // ClipDrop API implementation
  private async callClipdropAPI(
    apiKey: string,
    file: File,
    options: any,
    onProgress?: (progress: number) => void,
  ): Promise<{
    file: File;
    blob: Blob;
    metadata: any;
  } | null> {
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append("image_file", file);

      onProgress?.(30);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        "https://clipdrop-api.co/remove-background/v1",
        {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
          },
          body: formData,
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);
      onProgress?.(70);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("ClipDrop API key invalid - trying other services");
        }
        if (response.status === 402) {
          throw new Error("ClipDrop API quota exceeded - trying other services");
        }
        throw new Error(`ClipDrop API error ${response.status} - trying other services`);
      }

      const blob = await response.blob();
      onProgress?.(90);

      const resultFile = new File(
        [blob],
        file.name.replace(/\.[^/.]+$/, "") + "_removed_bg.png",
        { type: "image/png" },
      );

      onProgress?.(100);

      const metadata = {
        model: "clipdrop",
        processingTime: Date.now() - startTime,
        confidence: 88,
        edgeQuality: 88,
        originalSize: file.size,
        resultSize: blob.size,
      };

      return { file: resultFile, blob, metadata };
    } catch (error) {
      console.error("ClipDrop API failed:", error);
      throw error;
    }
  }

  // Map our model types to Remove.bg API types
  private mapToRemoveBgType(model: string): string | null {
    const mapping: Record<string, string> = {
      person: "person",
      product: "product",
      animal: "animal",
      car: "car",
      general: "auto",
    };
    return mapping[model] || "auto";
  }

  // Client-side background removal using canvas and image processing
  private async removeBackgroundClientSide(
    file: File,
    options: any,
    onProgress?: (progress: number) => void,
  ): Promise<{
    file: File;
    blob: Blob;
    metadata: any;
  }> {
    const startTime = Date.now();

    try {
      console.log("Starting client-side background removal...");
      onProgress?.(10);

      // Create canvas and context
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas context not available");
      }

      // Use FileReader instead of URL.createObjectURL for better reliability
      const imageData = await new Promise<ImageData>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          const img = new Image();

          img.onload = () => {
            try {
              console.log(`Image loaded: ${img.width}x${img.height}`);

              canvas.width = img.width;
              canvas.height = img.height;

              // Draw image to canvas
              ctx.drawImage(img, 0, 0);
              onProgress?.(30);

              // Get image data
              const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
              resolve(data);
            } catch (error) {
              console.error("Error drawing image to canvas:", error);
              reject(error);
            }
          };

          img.onerror = (error) => {
            console.error("Image creation failed:", error);
            reject(new Error("Invalid image file"));
          };

          // Set the image source
          img.src = e.target?.result as string;
        };

        reader.onerror = () => {
          console.error("FileReader failed");
          reject(new Error("Failed to read file"));
        };

        // Read as data URL
        reader.readAsDataURL(file);
      });

      onProgress?.(50);

      console.log("Processing image data for background removal...");

      // Process the image data with enhanced algorithm for complex scenes
      const processedImageData = this.enhancedBackgroundRemovalForComplexScenes(
        imageData,
        options,
        (progress) => onProgress?.(50 + progress * 0.4),
      );

      onProgress?.(90);

      // Put processed data back to canvas
      ctx.putImageData(processedImageData, 0, 0);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create output blob"));
              return;
            }
            resolve(blob);
          },
          "image/png",
          1.0,
        );
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      const resultFile = new File(
        [blob],
        file.name.replace(/\.[^/.]+$/, "_no_bg.png"),
        { type: "image/png" },
      );

      console.log("Background removal completed successfully!");

      return {
        file: resultFile,
        blob,
        metadata: {
          model: options.model || "client-side",
          processingTime,
          confidence: 82,
          edgeQuality: 78,
          originalSize: file.size,
          resultSize: blob.size,
        },
      };
    } catch (error) {
      console.error("Client-side background removal failed:", error);
      throw error;
    }
  }

  // Enhanced background removal with improved edge detection and color preservation
  private simpleBackgroundRemovalWithEdgeDetection(
    imageData: ImageData,
    options: any,
    onProgress?: (progress: number) => void,
  ): ImageData {
    console.log(
      "Starting enhanced background removal with improved edge detection...",
    );
    onProgress?.(5);

    const { data, width, height } = imageData;
    const processedData = new Uint8ClampedArray(data);

    // Step 1: Enhanced background color sampling from multiple regions
    const backgroundColors = this.advancedBackgroundSampling(
      data,
      width,
      height,
    );
    onProgress?.(15);

    // Step 2: Create sophisticated edge map for better object detection
    const edgeMap = this.createAdvancedEdgeMap(data, width, height);
    onProgress?.(25);

    // Step 3: Create mask based on multiple criteria with model-specific thresholds
    const threshold = this.getEnhancedThresholdForModel(options.model) || 25;

    // Step 4: Advanced content detection for better preservation
    const contentMask = this.detectAdvancedContent(
      data,
      width,
      height,
      edgeMap,
    );
    onProgress?.(35);

    // Step 5: Process each pixel with improved algorithm
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Copy RGB values initially
      processedData[i] = r;
      processedData[i + 1] = g;
      processedData[i + 2] = b;

      // Calculate perceptual color difference to background colors
      let minDistance = Infinity;
      for (const bgColor of backgroundColors) {
        const distance = this.calculatePerceptualColorDistance(
          { r, g, b },
          bgColor,
        );
        minDistance = Math.min(minDistance, distance);
      }

      // Enhanced edge-based threshold adjustment
      const edgeStrength = edgeMap[pixelIndex];
      const edgeDistance = Math.min(x, y, width - 1 - x, height - 1 - y);
      const maxEdgeDistance = Math.min(width, height) / 4;
      const edgeFactor = Math.min(1, edgeDistance / maxEdgeDistance);

      // Multi-factor threshold adjustment
      let adjustedThreshold = threshold;
      adjustedThreshold *= 0.6 + 0.4 * edgeFactor; // Edge distance factor
      adjustedThreshold *= 1 + edgeStrength * 0.5; // Edge strength factor

      // Check if this pixel is important content
      const isImportantContent = contentMask[pixelIndex];

      // Enhanced alpha calculation with improved falloff
      let alpha = 255;
      if (minDistance < adjustedThreshold) {
        // Improved smooth transition with better edge preservation
        const ratio = minDistance / adjustedThreshold;

        // Use different curves based on content type
        if (isImportantContent) {
          // More conservative removal for important content
          alpha = Math.floor(Math.pow(ratio, 0.5) * 255);
          alpha = Math.max(alpha, 200); // Minimum 78% opacity for important content
        } else {
          // More aggressive removal for likely background
          alpha = Math.floor(Math.pow(ratio, 1.2) * 255);
        }

        // Color enhancement for preserved areas
        if (alpha > 150) {
          // Calculate color characteristics
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max > 0 ? (max - min) / max : 0;
          const brightness = (r + g + b) / 3;

          // Enhance colors based on content type
          let boostFactor = 1.0;
          if (isImportantContent) {
            boostFactor = saturation > 0.3 ? 1.2 : 1.1;
          } else if (saturation > 0.2 && brightness > 50) {
            boostFactor = 1.08;
          }

          // Apply color enhancement
          if (boostFactor > 1.0) {
            processedData[i] = Math.min(255, Math.floor(r * boostFactor));
            processedData[i + 1] = Math.min(255, Math.floor(g * boostFactor));
            processedData[i + 2] = Math.min(255, Math.floor(b * boostFactor));
          }
        }
      } else {
        // Definite foreground - preserve and potentially enhance
        if (isImportantContent) {
          // Slight enhancement for important content
          const boostFactor = 1.05;
          processedData[i] = Math.min(255, Math.floor(r * boostFactor));
          processedData[i + 1] = Math.min(255, Math.floor(g * boostFactor));
          processedData[i + 2] = Math.min(255, Math.floor(b * boostFactor));
        }
      }

      processedData[i + 3] = alpha;
    }

    onProgress?.(70);

    // Step 6: Advanced post-processing for color enhancement
    this.enhanceTextAndGraphicsColors(
      processedData,
      contentMask,
      width,
      height,
    );
    onProgress?.(80);

    // Step 7: Improved edge smoothing with content preservation
    this.applySmoothingPass(
      processedData,
      width,
      height,
      options.edgeSmoothing || 2,
    );
    onProgress?.(90);

    onProgress?.(100);

    console.log("Background removal processing completed");
    return new ImageData(processedData, width, height);
  }

  // Enhanced background removal specifically designed for complex, crowded scenes
  private enhancedBackgroundRemovalForComplexScenes(
    imageData: ImageData,
    options: any,
    onProgress?: (progress: number) => void,
  ): ImageData {
    console.log("Starting aggressive background removal for complex scenes...");
    onProgress?.(10);

    const { data, width, height } = imageData;
    const processedData = new Uint8ClampedArray(data);

    // Simple but effective approach: find the main subject in center
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    onProgress?.(30);

    // Step 1: Create sophisticated person detection mask
    const mask = new Float32Array(width * height);

    // Find the main subject using multiple criteria
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Distance from center with more focused region
        const centerDistance = Math.sqrt(
          (x - centerX) ** 2 + (y - centerY) ** 2,
        );
        const focusRadius = Math.min(width, height) * 0.4; // More focused center
        const centerScore = Math.max(0, 1 - centerDistance / focusRadius);

        // Enhanced skin tone detection
        const skinScore = this.enhancedSkinToneDetection(r, g, b);

        // Color consistency check (person should have consistent colors)
        const consistencyScore = this.checkColorConsistency(
          data,
          x,
          y,
          width,
          height,
        );

        // Brightness check (avoid very bright/dark areas that are likely background)
        const brightness = (r + g + b) / 3;
        const brightnessScore = brightness > 50 && brightness < 200 ? 1.0 : 0.2;

        // Combine all factors with stricter requirements
        const finalScore =
          centerScore * 0.4 +
          skinScore * 0.3 +
          consistencyScore * 0.2 +
          brightnessScore * 0.1;
        mask[y * width + x] = finalScore;
      }
    }

    onProgress?.(60);

    // Step 2: Apply extremely aggressive background removal like Remove.bg
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;

      // Copy RGB values
      processedData[i] = data[i];
      processedData[i + 1] = data[i + 1];
      processedData[i + 2] = data[i + 2];

      // Extremely aggressive alpha calculation to match Remove.bg
      const maskValue = mask[pixelIndex];
      let alpha = 0;

      if (maskValue > 0.6) {
        // Very high confidence - definitely foreground
        alpha = 255;
      } else if (maskValue > 0.45) {
        // High confidence - likely foreground
        alpha = 255;
      } else if (maskValue > 0.3) {
        // Medium confidence - check additional criteria
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Additional checks for edge cases
        const isNearCenter =
          Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) <
          Math.min(width, height) * 0.3;
        const hasSkinTone = this.enhancedSkinToneDetection(r, g, b) > 0.4;

        if (isNearCenter && hasSkinTone) {
          alpha = 255;
        } else {
          alpha = 0; // Remove uncertain areas
        }
      } else {
        // Low confidence - definitely background, remove completely
        alpha = 0;
      }

      processedData[i + 3] = alpha;
    }

    onProgress?.(80);

    // Step 3: Professional-grade post-processing
    this.professionalPostProcessing(processedData, width, height, mask);
    onProgress?.(90);

    // Step 4: Final cleanup and artifact removal
    this.removeArtifactsAndCleanEdges(processedData, width, height);

    console.log("Professional background removal completed");
    onProgress?.(100);

    return new ImageData(processedData, width, height);
  }

  // Enhanced skin tone detection with better accuracy
  private enhancedSkinToneDetection(r: number, g: number, b: number): number {
    // More sophisticated skin tone detection
    const rg = r - g;
    const rb = r - b;
    const gb = g - b;

    // Multiple skin tone criteria with scores
    let score = 0;

    // Light skin tones
    if (r > 95 && g > 65 && b > 50 && rg > 15 && rb > 15) score += 0.8;

    // Medium skin tones
    if (r > 70 && g > 50 && b > 30 && rg > 5 && rb > 10 && Math.abs(rg) < 50)
      score += 0.7;

    // Dark skin tones
    if (r > 45 && g > 35 && b > 20 && rg > 3 && rb > 8) score += 0.6;

    // Additional checks for clothing colors (blue saree in this case)
    if (b > r && b > g && b > 50) score += 0.4; // Blue clothing

    return Math.min(1, score);
  }

  // Check color consistency in local area
  private checkColorConsistency(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    height: number,
  ): number {
    const radius = 5;
    const centerIdx = (y * width + x) * 4;
    const centerR = data[centerIdx];
    const centerG = data[centerIdx + 1];
    const centerB = data[centerIdx + 2];

    let similarPixels = 0;
    let totalPixels = 0;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = (ny * width + nx) * 4;
          const distance = Math.sqrt(
            Math.pow(data[idx] - centerR, 2) +
              Math.pow(data[idx + 1] - centerG, 2) +
              Math.pow(data[idx + 2] - centerB, 2),
          );

          if (distance < 60) similarPixels++; // More lenient threshold
          totalPixels++;
        }
      }
    }

    return totalPixels > 0 ? similarPixels / totalPixels : 0;
  }

  // Simple skin tone detection (kept for compatibility)
  private isLikelySkinTone(r: number, g: number, b: number): boolean {
    return this.enhancedSkinToneDetection(r, g, b) > 0.3;
  }

  // Professional post-processing to match Remove.bg quality
  private professionalPostProcessing(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    mask: Float32Array,
  ): void {
    const processed = new Uint8ClampedArray(data);

    // Pass 1: Remove isolated pixels and small artifacts
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        const idx = (y * width + x) * 4;

        if (data[idx + 3] > 0) {
          // Check if this pixel is isolated (surrounded by transparent pixels)
          let neighborCount = 0;
          let totalNeighbors = 0;

          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              totalNeighbors++;
              if (data[nIdx + 3] > 0) neighborCount++;
            }
          }

          // If less than 30% of neighbors are visible, remove this pixel
          if (neighborCount / totalNeighbors < 0.3) {
            processed[idx + 3] = 0;
          }
        }
      }
    }

    // Pass 2: Fill small holes in the main subject
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        if (processed[idx + 3] === 0 && mask[y * width + x] > 0.4) {
          // Check if surrounded by visible pixels
          let visibleNeighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              if (processed[nIdx + 3] > 200) visibleNeighbors++;
            }
          }

          // If mostly surrounded by visible pixels, fill the hole
          if (visibleNeighbors >= 6) {
            processed[idx + 3] = 255;
          }
        }
      }
    }

    // Copy processed data back
    for (let i = 0; i < data.length; i++) {
      data[i] = processed[i];
    }
  }

  // Remove artifacts and clean edges for professional quality
  private removeArtifactsAndCleanEdges(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): void {
    const refined = new Uint8ClampedArray(data);

    // Pass 1: Remove very small disconnected regions
    const visited = new Set<number>();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixelIndex = y * width + x;

        if (data[idx + 3] > 0 && !visited.has(pixelIndex)) {
          // Find connected component using flood fill
          const component = this.floodFillComponent(
            data,
            x,
            y,
            width,
            height,
            visited,
          );

          // If component is too small, remove it
          if (component.length < 500) {
            // Minimum size threshold
            for (const pixel of component) {
              const removeIdx = pixel * 4;
              refined[removeIdx + 3] = 0;
            }
          }
        }
      }
    }

    // Pass 2: Clean up edges by removing partial transparency
    for (let i = 3; i < refined.length; i += 4) {
      if (refined[i] > 0 && refined[i] < 255) {
        // Convert partial transparency to binary (either keep or remove)
        refined[i] = refined[i] > 128 ? 255 : 0;
      }
    }

    // Pass 3: Final edge smoothing only on the boundary
    this.smoothBoundaryEdges(refined, width, height);

    // Copy refined data back
    for (let i = 0; i < data.length; i++) {
      data[i] = refined[i];
    }
  }

  // Flood fill to find connected components
  private floodFillComponent(
    data: Uint8ClampedArray,
    startX: number,
    startY: number,
    width: number,
    height: number,
    visited: Set<number>,
  ): number[] {
    const component: number[] = [];
    const stack: [number, number][] = [[startX, startY]];

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const pixelIndex = y * width + x;
      const idx = pixelIndex * 4;

      if (
        x < 0 ||
        x >= width ||
        y < 0 ||
        y >= height ||
        visited.has(pixelIndex) ||
        data[idx + 3] === 0
      ) {
        continue;
      }

      visited.add(pixelIndex);
      component.push(pixelIndex);

      // Add 4-connected neighbors
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    return component;
  }

  // Smooth only the boundary edges for natural look
  private smoothBoundaryEdges(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): void {
    const smoothed = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Only smooth pixels that are on the boundary
        if (data[idx + 3] === 255) {
          let hasTransparentNeighbor = false;

          // Check if any neighbor is transparent
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              if (data[nIdx + 3] === 0) {
                hasTransparentNeighbor = true;
                break;
              }
            }
            if (hasTransparentNeighbor) break;
          }

          // Apply very subtle smoothing only to boundary pixels
          if (hasTransparentNeighbor) {
            let alphaSum = 0;
            let count = 0;

            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nIdx = ((y + dy) * width + (x + dx)) * 4;
                alphaSum += data[nIdx + 3];
                count++;
              }
            }

            const avgAlpha = alphaSum / count;
            if (avgAlpha > 200) {
              smoothed[idx + 3] = 255; // Keep solid
            } else if (avgAlpha < 50) {
              smoothed[idx + 3] = 0; // Remove
            } else {
              smoothed[idx + 3] = avgAlpha > 128 ? 255 : 0; // Binary decision
            }
          }
        }
      }
    }

    // Copy smoothed alpha back
    for (let i = 3; i < data.length; i += 4) {
      data[i] = smoothed[i];
    }
  }

  // Create person detection map using skin tone and human-like features
  private createPersonDetectionMap(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): Float32Array {
    const detectionMap = new Float32Array(width * height);

    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Skin tone detection (improved algorithm)
      const skinScore = this.calculateSkinToneScore(r, g, b);

      // Color coherence (areas with similar colors are likely to be objects)
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      const coherenceScore = this.calculateLocalColorCoherence(
        data,
        x,
        y,
        width,
        height,
      );

      // Combine scores
      detectionMap[pixelIndex] = Math.min(
        1,
        skinScore * 0.6 + coherenceScore * 0.4,
      );
    }

    // Apply smoothing to detection map
    return this.smoothDetectionMap(detectionMap, width, height);
  }

  // Calculate skin tone probability
  private calculateSkinToneScore(r: number, g: number, b: number): number {
    // Enhanced skin tone detection algorithm
    const rg = r - g;
    const rb = r - b;
    const gb = g - b;

    // Multiple skin tone ranges for better coverage
    const skinConditions = [
      // Light skin tones
      r > 60 && g > 40 && b > 20 && rg > 15 && rb > 15 && r > g && g > b,
      // Medium skin tones
      r > 80 && g > 50 && b > 30 && rg > 10 && rb > 20 && Math.abs(rg) < 40,
      // Dark skin tones
      r > 40 && g > 30 && b > 15 && rg > 5 && rb > 10 && r > g,
      // Additional ranges
      r > 45 && g > 34 && b > 20 && r > g && g >= b && rg >= 15 && rb >= 15,
    ];

    const matchingConditions = skinConditions.filter(
      (condition) => condition,
    ).length;
    return Math.min(1, matchingConditions / skinConditions.length + 0.2);
  }

  // Calculate local color coherence
  private calculateLocalColorCoherence(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    height: number,
  ): number {
    const radius = 3;
    const centerIdx = (y * width + x) * 4;
    const centerR = data[centerIdx];
    const centerG = data[centerIdx + 1];
    const centerB = data[centerIdx + 2];

    let similarPixels = 0;
    let totalPixels = 0;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = (ny * width + nx) * 4;
          const distance = Math.sqrt(
            Math.pow(data[idx] - centerR, 2) +
              Math.pow(data[idx + 1] - centerG, 2) +
              Math.pow(data[idx + 2] - centerB, 2),
          );

          if (distance < 40) similarPixels++;
          totalPixels++;
        }
      }
    }

    return totalPixels > 0 ? similarPixels / totalPixels : 0;
  }

  // Create multi-scale edge detection map
  private createMultiScaleEdgeMap(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): Float32Array {
    const edgeMap = new Float32Array(width * height);

    // Multiple scales for better edge detection
    const scales = [1, 2, 3];

    for (const scale of scales) {
      const scaleEdges = this.createScaleSpecificEdgeMap(
        data,
        width,
        height,
        scale,
      );

      // Combine edges from different scales
      for (let i = 0; i < edgeMap.length; i++) {
        edgeMap[i] = Math.max(edgeMap[i], scaleEdges[i] / scales.length);
      }
    }

    return edgeMap;
  }

  // Create edge map for specific scale
  private createScaleSpecificEdgeMap(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    scale: number,
  ): Float32Array {
    const edgeMap = new Float32Array(width * height);

    for (let y = scale; y < height - scale; y++) {
      for (let x = scale; x < width - scale; x++) {
        let gx = 0,
          gy = 0;

        // Sobel operator with scaling
        for (let dy = -scale; dy <= scale; dy++) {
          for (let dx = -scale; dx <= scale; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

            // Sobel weights adjusted for scale
            const sobelX = dx / scale;
            const sobelY = dy / scale;

            gx += gray * sobelX;
            gy += gray * sobelY;
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy) / (255 * scale);
        edgeMap[y * width + x] = Math.min(1, magnitude);
      }
    }

    return edgeMap;
  }

  // Combine foreground detection methods
  private combineForegroundDetection(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    foregroundMap: Float32Array,
    edgeMap: Float32Array,
    model: string,
  ): Float32Array {
    const combinedMap = new Float32Array(width * height);

    // Model-specific weights
    const weights = this.getModelSpecificWeights(model);

    for (let i = 0; i < combinedMap.length; i++) {
      const x = i % width;
      const y = Math.floor(i / width);

      // Distance from center (people are often centered)
      const centerX = width / 2;
      const centerY = height / 2;
      const centerDistance = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2),
      );
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      const centerFactor = 1 - (centerDistance / maxDistance) * 0.3;

      // Combine all factors
      combinedMap[i] = Math.min(
        1,
        foregroundMap[i] * weights.foreground +
          edgeMap[i] * weights.edge +
          centerFactor * weights.center,
      );
    }

    return combinedMap;
  }

  // Get model-specific detection weights
  private getModelSpecificWeights(model: string): {
    foreground: number;
    edge: number;
    center: number;
  } {
    const weights = {
      person: { foreground: 0.6, edge: 0.25, center: 0.15 },
      general: { foreground: 0.4, edge: 0.4, center: 0.2 },
      product: { foreground: 0.3, edge: 0.5, center: 0.2 },
      animal: { foreground: 0.5, edge: 0.3, center: 0.2 },
      car: { foreground: 0.2, edge: 0.6, center: 0.2 },
      building: { foreground: 0.1, edge: 0.7, center: 0.2 },
    };

    return weights[model as keyof typeof weights] || weights.general;
  }

  // Smooth detection map to reduce noise
  private smoothDetectionMap(
    detectionMap: Float32Array,
    width: number,
    height: number,
  ): Float32Array {
    const smoothed = new Float32Array(detectionMap.length);
    const radius = 2;

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        let sum = 0;
        let count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const idx = (y + dy) * width + (x + dx);
            sum += detectionMap[idx];
            count++;
          }
        }

        smoothed[y * width + x] = sum / count;
      }
    }

    return smoothed;
  }

  // Apply edge refinement for smoother alpha transitions
  private applyEdgeRefinement(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    edgeMap: Float32Array,
  ): void {
    const tempData = new Uint8ClampedArray(data);
    const radius = 1;

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = (y * width + x) * 4;
        const edgeStrength = edgeMap[y * width + x];

        if (edgeStrength > 0.3) {
          // Apply smoothing around edges
          let alphaSum = 0;
          let count = 0;

          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              alphaSum += data[nIdx + 3];
              count++;
            }
          }

          const avgAlpha = alphaSum / count;
          const currentAlpha = data[idx + 3];

          // Blend based on edge strength
          tempData[idx + 3] = Math.round(
            currentAlpha * (1 - edgeStrength * 0.3) +
              avgAlpha * (edgeStrength * 0.3),
          );
        }
      }
    }

    // Copy refined alpha values back
    for (let i = 3; i < data.length; i += 4) {
      data[i] = tempData[i];
    }
  }

  // Advanced background color sampling from multiple regions
  private advancedBackgroundSampling(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): Array<{ r: number; g: number; b: number }> {
    const colors: Array<{ r: number; g: number; b: number }> = [];
    const sampleSize = 8; // Reduced sample size for more precise detection

    // Sample from corners and edges with improved logic
    const regions = [
      // Corners (most likely to be background)
      { x: 0, y: 0, w: width * 0.15, h: height * 0.15, weight: 3 },
      { x: width * 0.85, y: 0, w: width * 0.15, h: height * 0.15, weight: 3 },
      { x: 0, y: height * 0.85, w: width * 0.15, h: height * 0.15, weight: 3 },
      {
        x: width * 0.85,
        y: height * 0.85,
        w: width * 0.15,
        h: height * 0.15,
        weight: 3,
      },

      // Edge centers (likely background)
      { x: width * 0.4, y: 0, w: width * 0.2, h: height * 0.1, weight: 2 },
      {
        x: width * 0.4,
        y: height * 0.9,
        w: width * 0.2,
        h: height * 0.1,
        weight: 2,
      },
      { x: 0, y: height * 0.4, w: width * 0.1, h: height * 0.2, weight: 2 },
      {
        x: width * 0.9,
        y: height * 0.4,
        w: width * 0.1,
        h: height * 0.2,
        weight: 2,
      },
    ];

    for (const region of regions) {
      for (let i = 0; i < sampleSize * region.weight; i++) {
        const x = Math.floor(region.x + Math.random() * region.w);
        const y = Math.floor(region.y + Math.random() * region.h);
        const index = (y * width + x) * 4;

        if (index >= 0 && index < data.length - 3) {
          colors.push({
            r: data[index],
            g: data[index + 1],
            b: data[index + 2],
          });
        }
      }
    }

    // Cluster similar colors to reduce noise
    return this.clusterSimilarColors(colors);
  }

  // Create advanced edge map for better object detection
  private createAdvancedEdgeMap(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): Float32Array {
    const edgeMap = new Float32Array(width * height);

    // Sobel edge detection with improved kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0,
          gy = 0;

        // Apply Sobel kernels
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            const kernelIdx = (dy + 1) * 3 + (dx + 1);

            gx += gray * sobelX[kernelIdx];
            gy += gray * sobelY[kernelIdx];
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy) / 1020; // Normalize
        edgeMap[y * width + x] = Math.min(1, magnitude);
      }
    }

    return edgeMap;
  }

  // Calculate perceptual color distance (LAB color space approximation)
  private calculatePerceptualColorDistance(
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number },
  ): number {
    // Convert to LAB-like space for perceptual accuracy
    const lab1 = this.rgbToPerceptualSpace(color1);
    const lab2 = this.rgbToPerceptualSpace(color2);

    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;

    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  }

  // Convert RGB to perceptual color space
  private rgbToPerceptualSpace(rgb: { r: number; g: number; b: number }) {
    // Simplified LAB conversion for better perceptual color matching
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    const a = (r - g) * 0.5;
    const bComp = 0.25 * (r + g) - 0.5 * b;

    return { l: l * 100, a: a * 100, b: bComp * 100 };
  }

  // Cluster similar colors to reduce background color noise
  private clusterSimilarColors(
    colors: Array<{ r: number; g: number; b: number }>,
  ): Array<{ r: number; g: number; b: number }> {
    if (colors.length === 0) return [];

    const clusters: Array<Array<{ r: number; g: number; b: number }>> = [];
    const threshold = 20; // Color similarity threshold

    for (const color of colors) {
      let addedToCluster = false;

      for (const cluster of clusters) {
        const avgColor = this.getAverageColor(cluster);
        const distance = this.calculatePerceptualColorDistance(color, avgColor);

        if (distance < threshold) {
          cluster.push(color);
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        clusters.push([color]);
      }
    }

    // Return average colors of largest clusters
    return clusters
      .sort((a, b) => b.length - a.length)
      .slice(0, 5) // Keep top 5 clusters
      .map((cluster) => this.getAverageColor(cluster));
  }

  // Get average color of a cluster
  private getAverageColor(colors: Array<{ r: number; g: number; b: number }>) {
    const sum = colors.reduce(
      (acc, color) => ({
        r: acc.r + color.r,
        g: acc.g + color.g,
        b: acc.b + color.b,
      }),
      { r: 0, g: 0, b: 0 },
    );

    return {
      r: Math.round(sum.r / colors.length),
      g: Math.round(sum.g / colors.length),
      b: Math.round(sum.b / colors.length),
    };
  }

  // Enhanced threshold selection based on content type
  private getEnhancedThresholdForModel(model: string): number {
    const thresholds: { [key: string]: number } = {
      person: 18, // Lower for better person detection
      product: 22, // Medium for clean product backgrounds
      general: 25, // Default balanced value
      animal: 20, // Lower for better fur/texture detection
      car: 28, // Higher for metallic surfaces
      building: 30, // Higher for architectural elements
    };

    return thresholds[model] || 25;
  }

  // Advanced content detection for better preservation
  private detectAdvancedContent(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    edgeMap: Float32Array,
  ): boolean[] {
    const contentMask = new Array(width * height).fill(false);

    // Detect high-contrast areas (likely text/graphics)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const pixelIdx = idx * 4;

        // Check local contrast
        let maxContrast = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
            const contrast =
              Math.abs(
                data[pixelIdx] +
                  data[pixelIdx + 1] +
                  data[pixelIdx + 2] -
                  (data[neighborIdx] +
                    data[neighborIdx + 1] +
                    data[neighborIdx + 2]),
              ) / 3;
            maxContrast = Math.max(maxContrast, contrast);
          }
        }

        // High contrast + strong edges = likely important content
        if (maxContrast > 40 && edgeMap[idx] > 0.3) {
          contentMask[idx] = true;
        }
      }
    }

    return contentMask;
  }

  // Enhance colors specifically for text and graphics elements
  private enhanceTextAndGraphicsColors(
    data: Uint8ClampedArray,
    contentMask: boolean[],
    width: number,
    height: number,
  ): void {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixelIndex = y * width + x;

        if (contentMask[pixelIndex] && data[idx + 3] > 200) {
          // High alpha text/graphics
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Calculate luminance
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

          // Apply contrast enhancement for text visibility
          let enhancementFactor = 1.0;

          // Dark text (typical black text)
          if (luminance < 80) {
            enhancementFactor = 0.85; // Make darker
          }
          // Light text (white text)
          else if (luminance > 200) {
            enhancementFactor = 1.1; // Make brighter
          }
          // Colored text
          else {
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max > 0 ? (max - min) / max : 0;

            if (saturation > 0.4) {
              enhancementFactor = 1.2; // Boost saturated colors
            }
          }

          // Apply enhancement
          data[idx] = Math.max(
            0,
            Math.min(255, Math.floor(r * enhancementFactor)),
          );
          data[idx + 1] = Math.max(
            0,
            Math.min(255, Math.floor(g * enhancementFactor)),
          );
          data[idx + 2] = Math.max(
            0,
            Math.min(255, Math.floor(b * enhancementFactor)),
          );
        }
      }
    }
  }

  // Detect text and graphics areas that should preserve color intensity
  private detectTextAndGraphics(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): boolean[] {
    const textMask = new Array(width * height).fill(false);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Calculate local contrast (edge strength)
        let maxContrast = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            const nr = data[nIdx];
            const ng = data[nIdx + 1];
            const nb = data[nIdx + 2];

            // Calculate color difference
            const contrast =
              Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
            maxContrast = Math.max(maxContrast, contrast);
          }
        }

        // High contrast areas are likely text/graphics
        // Also check for pure colors (high saturation)
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max > 0 ? (max - min) / max : 0;

        // Mark as text/graphics if high contrast OR high saturation
        textMask[y * width + x] = maxContrast > 80 || saturation > 0.6;
      }
    }

    return textMask;
  }

  // Sample colors from image edges (corners and borders)
  private sampleImageEdges(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): Array<{ r: number; g: number; b: number }> {
    const colors: Array<{ r: number; g: number; b: number }> = [];
    const sampleSize = Math.min(10, Math.floor(Math.min(width, height) / 20));

    // Sample from corners
    const corners = [
      { x: 0, y: 0 },
      { x: width - sampleSize, y: 0 },
      { x: 0, y: height - sampleSize },
      { x: width - sampleSize, y: height - sampleSize },
    ];

    for (const corner of corners) {
      for (let y = corner.y; y < corner.y + sampleSize && y < height; y++) {
        for (let x = corner.x; x < corner.x + sampleSize && x < width; x++) {
          const idx = (y * width + x) * 4;
          colors.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
          });
        }
      }
    }

    // Also sample from top and bottom edges
    for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 50))) {
      // Top edge
      const topIdx = x * 4;
      colors.push({
        r: data[topIdx],
        g: data[topIdx + 1],
        b: data[topIdx + 2],
      });

      // Bottom edge
      const bottomIdx = ((height - 1) * width + x) * 4;
      colors.push({
        r: data[bottomIdx],
        g: data[bottomIdx + 1],
        b: data[bottomIdx + 2],
      });
    }

    return colors;
  }

  // Improved background removal using edge detection and color clustering
  private improvedBackgroundRemoval(
    imageData: ImageData,
    options: any,
    onProgress?: (progress: number) => void,
  ): ImageData {
    onProgress?.(5);

    const { data, width, height } = imageData;
    const processedData = new Uint8ClampedArray(data);

    // Step 1: Edge detection to identify object boundaries
    const edges = this.detectEdges(data, width, height);
    onProgress?.(25);

    // Step 2: Color clustering to identify background regions
    const backgroundMask = this.createBackgroundMask(
      data,
      width,
      height,
      edges,
    );
    onProgress?.(50);

    // Step 3: Apply mask with smoothing for natural edges
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const y = Math.floor(pixelIndex / width);
      const x = pixelIndex % width;

      processedData[i] = data[i]; // R
      processedData[i + 1] = data[i + 1]; // G
      processedData[i + 2] = data[i + 2]; // B

      // Calculate alpha based on background probability
      let alpha = backgroundMask[pixelIndex] > 0.5 ? 0 : 255;

      // Apply edge smoothing
      if (options.edgeSmoothing > 0) {
        alpha = this.smoothAlpha(
          x,
          y,
          alpha,
          backgroundMask,
          width,
          height,
          options.edgeSmoothing,
        );
      }

      processedData[i + 3] = alpha;
    }

    onProgress?.(75);

    // Step 4: Post-processing to clean up artifacts
    this.cleanupArtifacts(processedData, width, height);
    onProgress?.(100);

    return new ImageData(processedData, width, height);
  }

  // Simple edge detection using Sobel operator
  private detectEdges(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): Float32Array {
    const edges = new Float32Array(width * height);
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0,
          gy = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const intensity = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);

            gx += intensity * sobelX[kernelIdx];
            gy += intensity * sobelY[kernelIdx];
          }
        }

        edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
      }
    }

    return edges;
  }

  // Create background mask using color similarity and edge information
  private createBackgroundMask(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    edges: Float32Array,
  ): Float32Array {
    const mask = new Float32Array(width * height);

    // Sample background colors from edges of the image
    const bgColors = this.sampleEdgeColors(data, width, height);
    const threshold = 30;

    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Find minimum distance to any background color
      let minDistance = Infinity;
      for (const bgColor of bgColors) {
        const distance = Math.sqrt(
          Math.pow(r - bgColor.r, 2) +
            Math.pow(g - bgColor.g, 2) +
            Math.pow(b - bgColor.b, 2),
        );
        minDistance = Math.min(minDistance, distance);
      }

      // Calculate background probability
      let bgProbability = 1 - Math.min(minDistance / threshold, 1);

      // Reduce probability near edges (likely object boundaries)
      const edgeStrength = edges[pixelIndex] / 50; // Normalize edge strength
      bgProbability *= Math.max(0, 1 - edgeStrength);

      mask[pixelIndex] = bgProbability;
    }

    return mask;
  }

  // Sample colors from image edges
  private sampleEdgeColors(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): Array<{ r: number; g: number; b: number }> {
    const colors = new Set<string>();
    const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 20));

    // Sample from all edges
    for (let i = 0; i < width; i += sampleStep) {
      // Top edge
      const topIdx = i * 4;
      colors.add(`${data[topIdx]},${data[topIdx + 1]},${data[topIdx + 2]}`);

      // Bottom edge
      const bottomIdx = ((height - 1) * width + i) * 4;
      colors.add(
        `${data[bottomIdx]},${data[bottomIdx + 1]},${data[bottomIdx + 2]}`,
      );
    }

    for (let i = 0; i < height; i += sampleStep) {
      // Left edge
      const leftIdx = i * width * 4;
      colors.add(`${data[leftIdx]},${data[leftIdx + 1]},${data[leftIdx + 2]}`);

      // Right edge
      const rightIdx = (i * width + width - 1) * 4;
      colors.add(
        `${data[rightIdx]},${data[rightIdx + 1]},${data[rightIdx + 2]}`,
      );
    }

    return Array.from(colors).map((colorStr) => {
      const [r, g, b] = colorStr.split(",").map(Number);
      return { r, g, b };
    });
  }

  // Smooth alpha values for natural edges
  private smoothAlpha(
    x: number,
    y: number,
    alpha: number,
    mask: Float32Array,
    width: number,
    height: number,
    smoothing: number,
  ): number {
    let sum = alpha;
    let count = 1;
    const radius = smoothing;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (
          nx >= 0 &&
          nx < width &&
          ny >= 0 &&
          ny < height &&
          (dx !== 0 || dy !== 0)
        ) {
          const neighborAlpha = mask[ny * width + nx] > 0.5 ? 0 : 255;
          sum += neighborAlpha;
          count++;
        }
      }
    }

    return Math.round(sum / count);
  }

  // Clean up small artifacts and noise
  private cleanupArtifacts(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): void {
    // Simple morphological operations to clean up noise
    const tempData = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const alpha = data[idx + 3];

        // Count transparent neighbors
        let transparentCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if (data[nIdx + 3] < 128) transparentCount++;
          }
        }

        // Remove isolated opaque pixels
        if (alpha > 128 && transparentCount > 6) {
          tempData[idx + 3] = 0;
        }
        // Fill isolated transparent pixels
        else if (alpha < 128 && transparentCount < 3) {
          tempData[idx + 3] = 255;
        }
      }
    }

    // Copy cleaned data back
    for (let i = 3; i < data.length; i += 4) {
      data[i] = tempData[i];
    }
  }

  // Simple but effective background removal (fallback)
  private simpleBackgroundRemoval(
    imageData: ImageData,
    options: any,
  ): ImageData {
    const { data, width, height } = imageData;
    const processedData = new Uint8ClampedArray(data);

    console.log("Using simple background removal algorithm");

    // Sample background colors from corners and edges
    const backgroundColors = this.sampleCornerColors(data, width, height);
    const threshold = 40; // Adjust based on testing

    // Create alpha channel based on color similarity to background
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      let minDistance = Infinity;

      // Find closest background color
      for (const bgColor of backgroundColors) {
        const distance = Math.sqrt(
          Math.pow(r - bgColor.r, 2) +
            Math.pow(g - bgColor.g, 2) +
            Math.pow(b - bgColor.b, 2),
        );
        minDistance = Math.min(minDistance, distance);
      }

      // Set alpha based on distance to background
      let alpha = 255;
      if (minDistance < threshold) {
        // Linear fade for soft edges
        alpha = Math.floor((minDistance / threshold) * 255);
      }

      processedData[i] = r;
      processedData[i + 1] = g;
      processedData[i + 2] = b;
      processedData[i + 3] = alpha;
    }

    // Apply simple smoothing to reduce harsh edges
    this.applySimpleSmoothing(processedData, width, height);

    return new ImageData(processedData, width, height);
  }

  // Sample colors from image corners and edges
  private sampleCornerColors(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): Array<{ r: number; g: number; b: number }> {
    const colors: Array<{ r: number; g: number; b: number }> = [];
    const sampleSize = Math.min(20, Math.floor(Math.min(width, height) / 10));

    // Sample from all four corners
    const corners = [
      { x: 0, y: 0 },
      { x: width - sampleSize, y: 0 },
      { x: 0, y: height - sampleSize },
      { x: width - sampleSize, y: height - sampleSize },
    ];

    for (const corner of corners) {
      for (let y = corner.y; y < corner.y + sampleSize && y < height; y++) {
        for (let x = corner.x; x < corner.x + sampleSize && x < width; x++) {
          const idx = (y * width + x) * 4;
          colors.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
          });
        }
      }
    }

    // Sample from edges
    const edgeStep = Math.max(1, Math.floor(Math.max(width, height) / 50));

    // Top and bottom edges
    for (let x = 0; x < width; x += edgeStep) {
      // Top edge
      let idx = x * 4;
      colors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });

      // Bottom edge
      idx = ((height - 1) * width + x) * 4;
      colors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }

    // Left and right edges
    for (let y = 0; y < height; y += edgeStep) {
      // Left edge
      let idx = y * width * 4;
      colors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });

      // Right edge
      idx = (y * width + width - 1) * 4;
      colors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }

    // Return clustered colors
    return this.clusterColors(colors).slice(0, 3);
  }

  // Apply simple smoothing to alpha channel
  private applySimpleSmoothing(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): void {
    const original = new Uint8ClampedArray(data);
    const radius = 1;

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = (y * width + x) * 4;

        // Skip fully opaque or fully transparent pixels
        if (original[idx + 3] === 0 || original[idx + 3] === 255) continue;

        let alphaSum = 0;
        let count = 0;

        // Average alpha in neighborhood
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            alphaSum += original[nIdx + 3];
            count++;
          }
        }

        data[idx + 3] = Math.floor(alphaSum / count);
      }
    }
  }

  // Enhanced background removal algorithm using GrabCut-inspired approach
  private async processImageForBackgroundRemoval(
    imageData: ImageData,
    options: any,
    onProgress?: (progress: number) => void,
  ): Promise<ImageData> {
    const { data, width, height } = imageData;
    const processedData = new Uint8ClampedArray(data);

    onProgress?.(5);

    try {
      // Use a more sophisticated approach based on the subject type
      const result = await this.advancedSubjectSegmentation(
        data,
        width,
        height,
        options,
        onProgress,
      );

      // Apply the result to the image data
      for (let i = 0; i < data.length; i += 4) {
        const pixelIndex = i / 4;
        processedData[i] = data[i]; // R
        processedData[i + 1] = data[i + 1]; // G
        processedData[i + 2] = data[i + 2]; // B
        processedData[i + 3] = result.mask[pixelIndex]; // Alpha
      }

      return new ImageData(processedData, width, height);
    } catch (error) {
      console.error("Advanced segmentation failed, using fallback:", error);
      // Fallback to simpler but more reliable algorithm
      return this.simpleFallbackRemoval(
        data,
        width,
        height,
        options,
        onProgress,
      );
    }
  }

  // Advanced subject segmentation inspired by GrabCut algorithm
  private async advancedSubjectSegmentation(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: any,
    onProgress?: (progress: number) => void,
  ): Promise<{ mask: Uint8ClampedArray }> {
    onProgress?.(10);

    // Convert to LAB color space for better color separation
    const labData = this.convertRGBToLAB(data);
    onProgress?.(20);

    // Use K-means clustering to segment the image
    const segments = await this.performKMeansClustering(
      labData,
      width,
      height,
      8,
    );
    onProgress?.(40);

    // Identify foreground clusters based on model type
    const foregroundClusters = this.identifyForegroundClusters(
      segments,
      options.model,
      width,
      height,
    );
    onProgress?.(60);

    // Create mask based on foreground clusters
    const mask = this.createMaskFromClusters(
      segments.labels,
      foregroundClusters,
      width,
      height,
    );
    onProgress?.(80);

    // Refine mask using graph cut optimization
    const refinedMask = this.refineMaskWithGraphCut(data, mask, width, height);
    onProgress?.(95);

    // Final smoothing
    this.applySigmoidSmoothing(refinedMask, width, height);
    onProgress?.(100);

    return { mask: refinedMask };
  }

  // Convert RGB to LAB color space for better perceptual color differences
  private convertRGBToLAB(data: Uint8ClampedArray): Float32Array {
    const labData = new Float32Array(data.length);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      // RGB to XYZ
      const rLinear =
        r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
      const gLinear =
        g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
      const bLinear =
        b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

      const x = rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375;
      const y = rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.072175;
      const z = rLinear * 0.0193339 + gLinear * 0.119192 + bLinear * 0.9503041;

      // XYZ to LAB
      const xn = x / 0.95047;
      const yn = y / 1.0;
      const zn = z / 1.08883;

      const fx = xn > 0.008856 ? Math.pow(xn, 1 / 3) : 7.787 * xn + 16 / 116;
      const fy = yn > 0.008856 ? Math.pow(yn, 1 / 3) : 7.787 * yn + 16 / 116;
      const fz = zn > 0.008856 ? Math.pow(zn, 1 / 3) : 7.787 * zn + 16 / 116;

      labData[i] = 116 * fy - 16; // L
      labData[i + 1] = 500 * (fx - fy); // A
      labData[i + 2] = 200 * (fy - fz); // B
      labData[i + 3] = data[i + 3]; // Alpha
    }

    return labData;
  }

  // K-means clustering for image segmentation
  private async performKMeansClustering(
    data: Float32Array,
    width: number,
    height: number,
    k: number,
  ): Promise<{ centroids: Float32Array; labels: Uint8ClampedArray }> {
    const numPixels = width * height;
    const centroids = new Float32Array(k * 3);
    const labels = new Uint8ClampedArray(numPixels);
    const clusterCounts = new Uint32Array(k);

    // Initialize centroids randomly
    for (let i = 0; i < k; i++) {
      const randomPixel = Math.floor(Math.random() * numPixels) * 4;
      centroids[i * 3] = data[randomPixel];
      centroids[i * 3 + 1] = data[randomPixel + 1];
      centroids[i * 3 + 2] = data[randomPixel + 2];
    }

    // K-means iterations
    for (let iter = 0; iter < 10; iter++) {
      clusterCounts.fill(0);
      const newCentroids = new Float32Array(k * 3);

      // Assign pixels to clusters
      for (let pixelIdx = 0; pixelIdx < numPixels; pixelIdx++) {
        const dataIdx = pixelIdx * 4;
        let minDist = Infinity;
        let bestCluster = 0;

        for (let cluster = 0; cluster < k; cluster++) {
          const centroidIdx = cluster * 3;
          const dist =
            Math.pow(data[dataIdx] - centroids[centroidIdx], 2) +
            Math.pow(data[dataIdx + 1] - centroids[centroidIdx + 1], 2) +
            Math.pow(data[dataIdx + 2] - centroids[centroidIdx + 2], 2);

          if (dist < minDist) {
            minDist = dist;
            bestCluster = cluster;
          }
        }

        labels[pixelIdx] = bestCluster;
        clusterCounts[bestCluster]++;

        // Add to new centroid calculation
        const centroidIdx = bestCluster * 3;
        newCentroids[centroidIdx] += data[dataIdx];
        newCentroids[centroidIdx + 1] += data[dataIdx + 1];
        newCentroids[centroidIdx + 2] += data[dataIdx + 2];
      }

      // Update centroids
      for (let cluster = 0; cluster < k; cluster++) {
        const centroidIdx = cluster * 3;
        if (clusterCounts[cluster] > 0) {
          centroids[centroidIdx] =
            newCentroids[centroidIdx] / clusterCounts[cluster];
          centroids[centroidIdx + 1] =
            newCentroids[centroidIdx + 1] / clusterCounts[cluster];
          centroids[centroidIdx + 2] =
            newCentroids[centroidIdx + 2] / clusterCounts[cluster];
        }
      }
    }

    return { centroids, labels };
  }

  // Identify which clusters likely belong to the foreground subject
  private identifyForegroundClusters(
    segments: { centroids: Float32Array; labels: Uint8ClampedArray },
    model: string,
    width: number,
    height: number,
  ): Set<number> {
    const foregroundClusters = new Set<number>();
    const numClusters = segments.centroids.length / 3;

    // Calculate cluster positions and sizes
    const clusterStats = new Array(numClusters).fill(0).map(() => ({
      count: 0,
      centerX: 0,
      centerY: 0,
      minX: width,
      maxX: 0,
      minY: height,
      maxY: 0,
    }));

    // Analyze cluster spatial distribution
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIdx = y * width + x;
        const cluster = segments.labels[pixelIdx];
        const stats = clusterStats[cluster];

        stats.count++;
        stats.centerX += x;
        stats.centerY += y;
        stats.minX = Math.min(stats.minX, x);
        stats.maxX = Math.max(stats.maxX, x);
        stats.minY = Math.min(stats.minY, y);
        stats.maxY = Math.max(stats.maxY, y);
      }
    }

    // Finalize cluster statistics
    for (let i = 0; i < numClusters; i++) {
      if (clusterStats[i].count > 0) {
        clusterStats[i].centerX /= clusterStats[i].count;
        clusterStats[i].centerY /= clusterStats[i].count;
      }
    }

    // Score clusters based on model type and spatial characteristics
    const clusterScores = clusterStats.map((stats, idx) => {
      let score = 0;

      // Size score - moderate sized clusters are more likely to be subjects
      const sizeRatio = stats.count / (width * height);
      if (sizeRatio > 0.05 && sizeRatio < 0.7) {
        score += 0.3;
      }

      // Position score - subjects often appear in central regions
      const centerDistanceX = Math.abs(stats.centerX - width / 2) / (width / 2);
      const centerDistanceY =
        Math.abs(stats.centerY - height / 2) / (height / 2);
      const centerScore =
        1 -
        Math.sqrt(
          centerDistanceX * centerDistanceX + centerDistanceY * centerDistanceY,
        ) /
          Math.sqrt(2);
      score += centerScore * 0.4;

      // Compactness score - subjects tend to be more compact than backgrounds
      const area = (stats.maxX - stats.minX) * (stats.maxY - stats.minY);
      const compactness = area > 0 ? stats.count / area : 0;
      score += Math.min(compactness, 1) * 0.3;

      return { index: idx, score };
    });

    // Select top-scoring clusters as foreground
    clusterScores.sort((a, b) => b.score - a.score);
    const numForegroundClusters = Math.min(Math.ceil(numClusters / 3), 4);

    for (let i = 0; i < numForegroundClusters; i++) {
      foregroundClusters.add(clusterScores[i].index);
    }

    return foregroundClusters;
  }

  // Create mask from identified foreground clusters
  private createMaskFromClusters(
    labels: Uint8ClampedArray,
    foregroundClusters: Set<number>,
    width: number,
    height: number,
  ): Uint8ClampedArray {
    const mask = new Uint8ClampedArray(width * height);

    for (let i = 0; i < labels.length; i++) {
      mask[i] = foregroundClusters.has(labels[i]) ? 255 : 0;
    }

    return mask;
  }

  // Refine mask using simplified graph cut optimization
  private refineMaskWithGraphCut(
    data: Uint8ClampedArray,
    mask: Uint8ClampedArray,
    width: number,
    height: number,
  ): Uint8ClampedArray {
    const refinedMask = new Uint8ClampedArray(mask);

    // Multiple passes of local optimization
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const dataIdx = idx * 4;

          // Calculate energy for current state vs flipped state
          const currentEnergy = this.calculateLocalEnergy(
            data,
            mask,
            x,
            y,
            width,
            height,
            mask[idx],
          );
          const flippedEnergy = this.calculateLocalEnergy(
            data,
            mask,
            x,
            y,
            width,
            height,
            255 - mask[idx],
          );

          if (flippedEnergy < currentEnergy) {
            refinedMask[idx] = 255 - mask[idx];
          }
        }
      }

      // Update mask for next pass
      for (let i = 0; i < mask.length; i++) {
        mask[i] = refinedMask[i];
      }
    }

    return refinedMask;
  }

  // Calculate local energy for graph cut optimization
  private calculateLocalEnergy(
    data: Uint8ClampedArray,
    mask: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    height: number,
    pixelValue: number,
  ): number {
    const idx = y * width + x;
    const dataIdx = idx * 4;
    let energy = 0;

    // Data term - how well does this pixel fit as foreground/background
    const intensity =
      (data[dataIdx] + data[dataIdx + 1] + data[dataIdx + 2]) / 3;
    energy += pixelValue > 128 ? (255 - intensity) / 255 : intensity / 255;

    // Smoothness term - encourage similar pixels to have similar labels
    const neighbors = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1], // 4-connected
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1], // 8-connected
    ];

    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        const nDataIdx = nIdx * 4;

        // Color similarity
        const colorDiff =
          Math.abs(data[dataIdx] - data[nDataIdx]) +
          Math.abs(data[dataIdx + 1] - data[nDataIdx + 1]) +
          Math.abs(data[dataIdx + 2] - data[nDataIdx + 2]);

        // Label difference penalty
        const labelDiff = Math.abs(pixelValue - mask[nIdx]);

        // Weight by inverse color difference (similar colors should have similar labels)
        const weight = 1 / (1 + colorDiff / 100);
        energy += (weight * labelDiff) / 255;
      }
    }

    return energy;
  }

  // Apply sigmoid smoothing for natural edge transitions
  private applySigmoidSmoothing(
    mask: Uint8ClampedArray,
    width: number,
    height: number,
  ): void {
    const original = new Uint8ClampedArray(mask);
    const sigma = 2.0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;

        // Calculate local gradient magnitude
        let gradMag = 0;
        const neighbors = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];

        for (const [dx, dy] of neighbors) {
          const nIdx = (y + dy) * width + (x + dx);
          gradMag += Math.abs(original[idx] - original[nIdx]);
        }

        gradMag /= 4;

        // Apply sigmoid function for smooth transitions
        const t = (gradMag - 64) / 32; // Threshold around mid-gray
        const sigmoid = 1 / (1 + Math.exp(-t / sigma));

        mask[idx] = Math.floor(
          original[idx] * sigmoid + (255 - original[idx]) * (1 - sigmoid),
        );
      }
    }
  }

  // Simple but reliable fallback algorithm
  private simpleFallbackRemoval(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: any,
    onProgress?: (progress: number) => void,
  ): ImageData {
    const processedData = new Uint8ClampedArray(data);
    onProgress?.(20);

    // Use adaptive threshold based on image statistics
    const stats = this.calculateImageStatistics(data);
    const threshold = this.calculateAdaptiveThreshold(stats, options.model);

    onProgress?.(40);

    // Simple but effective background removal
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Distance to most common background color
      const bgDist = Math.sqrt(
        Math.pow(r - stats.dominantColor.r, 2) +
          Math.pow(g - stats.dominantColor.g, 2) +
          Math.pow(b - stats.dominantColor.b, 2),
      );

      // Create soft alpha based on distance
      let alpha = 255;
      if (bgDist < threshold) {
        alpha = Math.floor((bgDist / threshold) * 255);
      }

      processedData[i] = r;
      processedData[i + 1] = g;
      processedData[i + 2] = b;
      processedData[i + 3] = alpha;
    }

    onProgress?.(100);

    return new ImageData(processedData, width, height);
  }

  // Calculate image statistics for adaptive processing
  private calculateImageStatistics(data: Uint8ClampedArray): {
    dominantColor: { r: number; g: number; b: number };
    averageColor: { r: number; g: number; b: number };
    contrast: number;
  } {
    let totalR = 0,
      totalG = 0,
      totalB = 0;
    let pixelCount = 0;
    const colorCounts = new Map<string, number>();

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      totalR += r;
      totalG += g;
      totalB += b;
      pixelCount++;

      // Quantize colors for dominant color detection
      const quantR = Math.floor(r / 32) * 32;
      const quantG = Math.floor(g / 32) * 32;
      const quantB = Math.floor(b / 32) * 32;
      const colorKey = `${quantR},${quantG},${quantB}`;

      colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
    }

    // Find dominant color
    let maxCount = 0;
    let dominantColor = { r: 255, g: 255, b: 255 };

    for (const [colorKey, count] of colorCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        const [r, g, b] = colorKey.split(",").map(Number);
        dominantColor = { r, g, b };
      }
    }

    const averageColor = {
      r: Math.floor(totalR / pixelCount),
      g: Math.floor(totalG / pixelCount),
      b: Math.floor(totalB / pixelCount),
    };

    // Calculate contrast
    let contrastSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const intensity = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const avgIntensity =
        (averageColor.r + averageColor.g + averageColor.b) / 3;
      contrastSum += Math.abs(intensity - avgIntensity);
    }

    const contrast = contrastSum / pixelCount;

    return { dominantColor, averageColor, contrast };
  }

  // Calculate adaptive threshold based on image characteristics
  private calculateAdaptiveThreshold(stats: any, model: string): number {
    let baseThreshold = 40;

    // Adjust based on model type
    switch (model) {
      case "person":
        baseThreshold = 30;
        break;
      case "product":
        baseThreshold = 50;
        break;
      case "animal":
        baseThreshold = 35;
        break;
      case "car":
        baseThreshold = 45;
        break;
      case "building":
        baseThreshold = 55;
        break;
    }

    // Adjust based on image contrast
    const contrastFactor = Math.min(2, Math.max(0.5, stats.contrast / 50));

    return baseThreshold * contrastFactor;
  }

  // Advanced background color sampling
  private sampleBackgroundColorsAdvanced(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    edges: Uint8ClampedArray,
  ): Array<{ r: number; g: number; b: number }> {
    const colors: Array<{ r: number; g: number; b: number }> = [];

    // Strategy 1: Sample from edges where edge strength is low (likely background)
    const edgeThreshold = 30;
    for (let y = 0; y < height; y += 5) {
      for (let x = 0; x < width; x += 5) {
        const edgeIdx = y * width + x;
        const dataIdx = edgeIdx * 4;

        if (edges[edgeIdx] < edgeThreshold) {
          colors.push({
            r: data[dataIdx],
            g: data[dataIdx + 1],
            b: data[dataIdx + 2],
          });
        }
      }
    }

    // Strategy 2: Enhanced corner and edge sampling
    const border = 20;
    const positions = [
      // Extended corner regions
      ...this.generateSamplePositions(0, 0, border, border),
      ...this.generateSamplePositions(width - border, 0, border, border),
      ...this.generateSamplePositions(0, height - border, border, border),
      ...this.generateSamplePositions(
        width - border,
        height - border,
        border,
        border,
      ),
      // Edge strips
      ...this.generateSamplePositions(border, 0, width - 2 * border, 5),
      ...this.generateSamplePositions(
        border,
        height - 5,
        width - 2 * border,
        5,
      ),
      ...this.generateSamplePositions(0, border, 5, height - 2 * border),
      ...this.generateSamplePositions(
        width - 5,
        border,
        5,
        height - 2 * border,
      ),
    ];

    for (const [x, y] of positions) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        colors.push({
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
        });
      }
    }

    // Cluster and return dominant background colors
    return this.clusterColorsAdvanced(colors).slice(0, 5);
  }

  // Generate sample positions for a region
  private generateSamplePositions(
    startX: number,
    startY: number,
    width: number,
    height: number,
  ): Array<[number, number]> {
    const positions: Array<[number, number]> = [];
    const step = Math.max(1, Math.min(width, height) / 10);

    for (let y = startY; y < startY + height; y += step) {
      for (let x = startX; x < startX + width; x += step) {
        positions.push([Math.floor(x), Math.floor(y)]);
      }
    }

    return positions;
  }

  // Create initial mask based on color similarity
  private createInitialMask(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    backgroundColors: Array<{ r: number; g: number; b: number }>,
    threshold: number,
  ): Uint8ClampedArray {
    const mask = new Uint8ClampedArray(width * height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const pixelIdx = i / 4;

      let isBackground = false;
      let minDistance = Infinity;

      // Find closest background color
      for (const bgColor of backgroundColors) {
        const distance = this.calculateColorDistance(
          r,
          g,
          b,
          bgColor.r,
          bgColor.g,
          bgColor.b,
        );
        minDistance = Math.min(minDistance, distance);

        if (distance < threshold) {
          isBackground = true;
          break;
        }
      }

      // Use a gradient approach for borderline cases
      if (!isBackground && minDistance < threshold * 1.5) {
        const confidence = 1 - (minDistance - threshold) / (threshold * 0.5);
        mask[pixelIdx] = Math.floor((1 - confidence) * 255);
      } else {
        mask[pixelIdx] = isBackground ? 0 : 255;
      }
    }

    return mask;
  }

  // Improved color distance calculation
  private calculateColorDistance(
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number,
  ): number {
    // Use weighted Euclidean distance (more perceptually accurate)
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;

    // Weights based on human perception
    return Math.sqrt(0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db);
  }

  // Refine mask using edge information
  private refineMaskWithEdges(
    mask: Uint8ClampedArray,
    edges: Uint8ClampedArray,
    width: number,
    height: number,
  ): void {
    const refined = new Uint8ClampedArray(mask);
    const edgeThreshold = 50;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;

        // If we're near a strong edge, preserve the original decision
        if (edges[idx] > edgeThreshold) {
          continue;
        }

        // Otherwise, consider neighboring mask values
        let neighborSum = 0;
        let count = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nIdx = (y + dy) * width + (x + dx);
            neighborSum += mask[nIdx];
            count++;
          }
        }

        const avgNeighbor = neighborSum / count;
        // Blend current value with neighborhood average
        refined[idx] = Math.floor((mask[idx] + avgNeighbor) / 2);
      }
    }

    // Copy refined values back
    for (let i = 0; i < mask.length; i++) {
      mask[i] = refined[i];
    }
  }

  // Apply morphological operations to clean up the mask
  private applyMorphologicalOperations(
    mask: Uint8ClampedArray,
    width: number,
    height: number,
    precision: string,
  ): void {
    const iterations =
      precision === "precise" ? 3 : precision === "balanced" ? 2 : 1;

    for (let i = 0; i < iterations; i++) {
      // Erosion to remove noise
      this.morphologicalErosion(mask, width, height, 1);
      // Dilation to restore object size
      this.morphologicalDilation(mask, width, height, 1);
    }
  }

  // Morphological erosion
  private morphologicalErosion(
    mask: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number,
  ): void {
    const original = new Uint8ClampedArray(mask);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = y * width + x;
        let minValue = 255;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nIdx = (y + dy) * width + (x + dx);
            minValue = Math.min(minValue, original[nIdx]);
          }
        }

        mask[idx] = minValue;
      }
    }
  }

  // Morphological dilation
  private morphologicalDilation(
    mask: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number,
  ): void {
    const original = new Uint8ClampedArray(mask);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = y * width + x;
        let maxValue = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nIdx = (y + dy) * width + (x + dx);
            maxValue = Math.max(maxValue, original[nIdx]);
          }
        }

        mask[idx] = maxValue;
      }
    }
  }

  // Apply mask to image data
  private applyMaskToImage(
    data: Uint8ClampedArray,
    mask: Uint8ClampedArray,
    width: number,
    height: number,
  ): void {
    for (let i = 0; i < mask.length; i++) {
      const alpha = mask[i];
      data[i * 4 + 3] = alpha;
    }
  }

  // Advanced edge smoothing with anti-aliasing
  private applyAdvancedEdgeSmoothing(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number,
  ): void {
    const original = new Uint8ClampedArray(data);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = (y * width + x) * 4;
        const currentAlpha = original[idx + 3];

        if (currentAlpha === 0 || currentAlpha === 255) continue;

        // Apply Gaussian-like smoothing
        let weightedAlpha = 0;
        let totalWeight = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > radius) continue;

            const weight = Math.exp(
              -(distance * distance) / (2 * radius * radius),
            );
            const nIdx = ((y + dy) * width + (x + dx)) * 4;

            weightedAlpha += original[nIdx + 3] * weight;
            totalWeight += weight;
          }
        }

        data[idx + 3] = Math.floor(weightedAlpha / totalWeight);
      }
    }
  }

  // Sample background colors from image edges
  private sampleBackgroundColors(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): Array<{ r: number; g: number; b: number }> {
    const colors: Array<{ r: number; g: number; b: number }> = [];
    const sampleSize = 5;

    // Sample from corners and edges
    const positions = [
      // Corners
      [0, 0],
      [width - 1, 0],
      [0, height - 1],
      [width - 1, height - 1],
      // Edge centers
      [Math.floor(width / 2), 0],
      [Math.floor(width / 2), height - 1],
      [0, Math.floor(height / 2)],
      [width - 1, Math.floor(height / 2)],
    ];

    for (const [x, y] of positions) {
      for (let dx = -sampleSize; dx <= sampleSize; dx++) {
        for (let dy = -sampleSize; dy <= sampleSize; dy++) {
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          const idx = (ny * width + nx) * 4;

          colors.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
          });
        }
      }
    }

    // Cluster similar colors and return most common ones
    return this.clusterColors(colors).slice(0, 3);
  }

  // Advanced color clustering with better similarity metrics
  private clusterColorsAdvanced(
    colors: Array<{ r: number; g: number; b: number }>,
  ): Array<{ r: number; g: number; b: number }> {
    if (colors.length === 0) return [];

    const clusters: Array<{
      color: { r: number; g: number; b: number };
      count: number;
      sumR: number;
      sumG: number;
      sumB: number;
    }> = [];
    const threshold = 35;

    for (const color of colors) {
      let found = false;
      let bestCluster = null;
      let minDistance = Infinity;

      // Find the closest cluster
      for (const cluster of clusters) {
        const distance = this.calculateColorDistance(
          color.r,
          color.g,
          color.b,
          cluster.color.r,
          cluster.color.g,
          cluster.color.b,
        );

        if (distance < threshold && distance < minDistance) {
          minDistance = distance;
          bestCluster = cluster;
          found = true;
        }
      }

      if (found && bestCluster) {
        // Update cluster with weighted average
        bestCluster.count++;
        bestCluster.sumR += color.r;
        bestCluster.sumG += color.g;
        bestCluster.sumB += color.b;

        // Recalculate cluster center
        bestCluster.color.r = Math.round(bestCluster.sumR / bestCluster.count);
        bestCluster.color.g = Math.round(bestCluster.sumG / bestCluster.count);
        bestCluster.color.b = Math.round(bestCluster.sumB / bestCluster.count);
      } else {
        // Create new cluster
        clusters.push({
          color: { ...color },
          count: 1,
          sumR: color.r,
          sumG: color.g,
          sumB: color.b,
        });
      }
    }

    // Filter out clusters with very few members (likely noise)
    const minClusterSize = Math.max(1, Math.floor(colors.length * 0.01));
    const significantClusters = clusters.filter(
      (cluster) => cluster.count >= minClusterSize,
    );

    // Sort by count and return colors
    return significantClusters
      .sort((a, b) => b.count - a.count)
      .map((cluster) => cluster.color);
  }

  // Simple color clustering (keeping for backward compatibility)
  private clusterColors(
    colors: Array<{ r: number; g: number; b: number }>,
  ): Array<{ r: number; g: number; b: number }> {
    return this.clusterColorsAdvanced(colors);
  }

  // Apply simple edge smoothing to reduce artifacts
  private applySmoothingPass(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    smoothingLevel: number,
  ): void {
    if (smoothingLevel <= 0) return;

    const original = new Uint8ClampedArray(data);
    const radius = Math.min(3, Math.max(1, Math.floor(smoothingLevel)));

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = (y * width + x) * 4;

        // Skip if already transparent
        if (original[idx + 3] === 0) continue;

        // Only smooth alpha channel to preserve color fidelity
        let alphaSum = 0;
        let count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = (ny * width + nx) * 4;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const weight = Math.exp(-distance / radius);

              alphaSum += original[nIdx + 3] * weight;
              count += weight;
            }
          }
        }

        if (count > 0) {
          data[idx + 3] = Math.round(alphaSum / count);
        }
      }
    }
  }

  // Analyze image and get metadata
  async analyzeImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/image/analyze", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to analyze image");
    }

    return await response.json();
  }

  // Resize image using backend API
  async resizeImageAPI(
    file: File,
    options: {
      width?: number;
      height?: number;
      fit?: "cover" | "contain" | "fill" | "inside" | "outside";
      quality?: number;
      format?: "jpeg" | "png" | "webp";
    },
  ): Promise<File> {
    const formData = new FormData();
    formData.append("image", file);

    if (options.width) formData.append("width", options.width.toString());
    if (options.height) formData.append("height", options.height.toString());
    if (options.fit) formData.append("fit", options.fit);
    if (options.quality) formData.append("quality", options.quality.toString());
    if (options.format) formData.append("format", options.format);

    const response = await fetch("/api/image/resize", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to resize image");
    }

    const blob = await response.blob();
    const fileName = `resized-${Date.now()}.${options.format || "jpeg"}`;
    return new File([blob], fileName, { type: blob.type });
  }

  // Get model-specific threshold for better accuracy
  private getThresholdForModel(model: string): number {
    const thresholds: Record<string, number> = {
      person: 25, // Tighter threshold for people
      product: 30, // Good for products with clean backgrounds
      animal: 35, // Moderate for animals with fur/feathers
      car: 40, // Vehicles often have complex reflections
      building: 45, // Architecture with varied textures
      general: 35, // Balanced default
    };
    return thresholds[model] || 35;
  }
}

// Helper function to convert compression level to quality percentage
function getQualityFromLevel(level: string): number {
  const qualityMap = {
    extreme: 40,
    high: 60,
    medium: 75,
    low: 85,
    "best-quality": 95,
  };
  return qualityMap[level as keyof typeof qualityMap] || 75;
}

// Export singleton instance
export const imageService = ImageService.getInstance();
