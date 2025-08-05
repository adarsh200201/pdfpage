// Centralized logo configuration to ensure consistency across the app
export const LOGO_CONFIG = {
  // Official PdfPage logo hosted on Builder.io
  OFFICIAL_LOGO_URL: "https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee",
  
  // Different formats and sizes
  LOGO_FORMATS: {
    webp: (width: number) => `https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=webp&width=${width}`,
    png: (width: number) => `https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=png&width=${width}`,
    svg: "/logo.svg",
    local_png: "/logo.png"
  },
  
  // Standard sizes
  SIZES: {
    favicon: 32,
    small: 64,
    medium: 128,
    large: 256,
    xl: 512,
    social: 1200
  },
  
  // Generate standard URLs
  getLogoUrl: (format: 'webp' | 'png' = 'webp', size: number = 512) => {
    if (format === 'webp') {
      return `https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=webp&width=${size}`;
    }
    return `https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=png&width=${size}`;
  }
};

// Brand colors for consistency
export const BRAND_COLORS = {
  primary: '#dc2626', // red-600
  primaryDark: '#b91c1c', // red-700
  primaryLight: '#ef4444', // red-500
};

export default LOGO_CONFIG;
