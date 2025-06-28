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

  // Compress image with quality control
  async compressImage(
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

        if (maxWidth && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (maxHeight && height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
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
          file.type,
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

    const token = localStorage.getItem("token");
    const response = await fetch("/api/image/crop", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

    // Try multiple API services in order of preference
    const services = [
      { name: "removebg", apiKey: import.meta.env.VITE_REMOVEBG_API_KEY },
      { name: "photroom", apiKey: import.meta.env.VITE_PHOTROOM_API_KEY },
      { name: "clipdrop", apiKey: import.meta.env.VITE_CLIPDROP_API_KEY },
    ];

    for (const service of services) {
      if (!service.apiKey) continue;

      try {
        console.log(`Trying ${service.name} API...`);
        onProgress?.(10);

        const result = await this.callBackgroundRemovalAPI(
          service,
          file,
          options,
          onProgress,
        );
        if (result) {
          console.log(`Successfully used ${service.name} API`);
          return result;
        }
      } catch (error) {
        console.warn(`${service.name} API failed:`, error);
        continue;
      }
    }

    console.log("No API services available or all failed");
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

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
        },
        body: formData,
      });

      onProgress?.(70);

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error("Remove.bg API quota exceeded");
        }
        throw new Error(`Remove.bg API error: ${response.status}`);
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

      const response = await fetch("https://sdk.photoroom.com/v1/segment", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
        },
        body: formData,
      });

      onProgress?.(70);

      if (!response.ok) {
        throw new Error(`Photroom API error: ${response.status}`);
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

      const response = await fetch(
        "https://clipdrop-api.co/remove-background/v1",
        {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
          },
          body: formData,
        },
      );

      onProgress?.(70);

      if (!response.ok) {
        throw new Error(`ClipDrop API error: ${response.status}`);
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

    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = async () => {
        try {
          onProgress?.(40);

          canvas.width = img.width;
          canvas.height = img.height;

          // Draw original image
          ctx?.drawImage(img, 0, 0);
          onProgress?.(50);

          // Get image data for processing
          const imageData = ctx!.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          onProgress?.(60);

          // Try advanced algorithm first, fallback to simple if it fails
          let processedImageData;
          try {
            console.log("Attempting advanced background removal...");
            processedImageData = await this.processImageForBackgroundRemoval(
              imageData,
              options,
              (progress) => onProgress?.(60 + progress * 0.25),
            );
          } catch (error) {
            console.warn(
              "Advanced algorithm failed, using simple removal:",
              error,
            );
            processedImageData = this.simpleBackgroundRemoval(
              imageData,
              options,
            );
            onProgress?.(85);
          }

          onProgress?.(90);

          // Put processed image data back
          ctx!.putImageData(processedImageData, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resultFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, "") + "_removed_bg.png",
                  { type: "image/png" },
                );

                const metadata = {
                  model: options.model || "client-side",
                  processingTime: Date.now() - startTime,
                  confidence: 75,
                  edgeQuality: 80,
                  originalSize: file.size,
                  resultSize: blob.size,
                };

                onProgress?.(100);
                console.log(
                  "Client-side background removal completed successfully",
                );
                resolve({ file: resultFile, blob, metadata });
              } else {
                reject(new Error("Failed to create blob"));
              }
            },
            "image/png",
            1.0,
          );
        } catch (error) {
          console.error("Client-side background removal failed:", error);
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  // Simple but effective background removal
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

  // Get optimal threshold based on the model type
  private getThresholdForModel(model: string): number {
    const thresholds: Record<string, number> = {
      person: 25, // Lower threshold for skin tones
      product: 40, // Higher threshold for clear product shots
      animal: 30, // Medium threshold for fur/hair
      car: 45, // Higher threshold for metallic surfaces
      building: 50, // Highest threshold for architectural elements
      general: 35, // Balanced threshold
    };
    return thresholds[model] || 35;
  }

  // Advanced edge detection using Sobel operator
  private detectEdges(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): Uint8ClampedArray {
    const edges = new Uint8ClampedArray(width * height);

    // Sobel kernels
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ];
    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0,
          gy = 0;

        // Apply Sobel kernels
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

            gx += gray * sobelX[ky + 1][kx + 1];
            gy += gray * sobelY[ky + 1][kx + 1];
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = Math.min(255, magnitude);
      }
    }

    return edges;
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

  // Apply edge smoothing to reduce artifacts
  private applyEdgeSmoothing(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number,
  ): void {
    const original = new Uint8ClampedArray(data);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = (y * width + x) * 4;

        if (original[idx + 3] === 0) continue; // Skip transparent pixels

        let neighboringTransparent = 0;
        let totalNeighbors = 0;

        // Check surrounding pixels
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nx = x + dx;
            const ny = y + dy;
            const nidx = (ny * width + nx) * 4;

            if (original[nidx + 3] === 0) {
              neighboringTransparent++;
            }
            totalNeighbors++;
          }
        }

        // Gradually reduce opacity near transparent areas
        const transparentRatio = neighboringTransparent / totalNeighbors;
        if (transparentRatio > 0.3) {
          data[idx + 3] = Math.floor(
            original[idx + 3] * (1 - transparentRatio * 0.7),
          );
        }
      }
    }
  }

  // Remove isolated background pixels
  private removeIsolatedPixels(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): void {
    const original = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        if (original[idx + 3] > 0) continue; // Skip opaque pixels

        let opaqueNeighbors = 0;

        // Check 8 surrounding pixels
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nidx = ((y + dy) * width + (x + dx)) * 4;
            if (original[nidx + 3] > 0) {
              opaqueNeighbors++;
            }
          }
        }

        // If surrounded mostly by opaque pixels, restore this pixel
        if (opaqueNeighbors >= 6) {
          data[idx + 3] = 255;
        }
      }
    }
  }
  // Analyze image and get metadata
  async analyzeImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("token");
    const response = await fetch("/api/image/analyze", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to analyze image");
    }

    return await response.json();
  }

  // Resize image using backend API
  async resizeImage(
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

    const token = localStorage.getItem("token");
    const response = await fetch("/api/image/resize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
}

// Export singleton instance
export const imageService = ImageService.getInstance();
