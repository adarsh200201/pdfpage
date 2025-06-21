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

  // Crop image to specified coordinates
  async cropImage(
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
}

export const imageService = ImageService.getInstance();
