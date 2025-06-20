import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // PdfPage Brand Colors
        brand: {
          red: "rgb(229, 50, 45)",
          yellow: "rgb(255, 194, 51)",
        },
        // Custom backgrounds
        "bg-light": "rgb(245, 245, 250)",
        "bg-white": "rgb(255, 255, 255)",
        "bg-dark": "rgb(71, 71, 79)",
        // Custom text colors
        "text-dark": "rgb(51, 51, 59)",
        "text-medium": "rgb(22, 22, 22)",
        "text-light": "rgb(112, 112, 120)",

        // Keep existing shadcn colors for components
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "rgb(229, 50, 45)", // Use brand red as primary
          foreground: "white",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        // Custom font sizes for PdfPage
        "heading-large": ["42px", { lineHeight: "52px", fontWeight: "600" }],
        "heading-medium": ["28px", { lineHeight: "30px", fontWeight: "500" }],
        "heading-small": ["20px", { lineHeight: "28px", fontWeight: "500" }],
        "body-large": ["22px", { lineHeight: "32px" }],
        "body-medium": ["14px", { lineHeight: "18px", fontWeight: "500" }],
        "body-small": ["13px", { lineHeight: "18px" }],
      },
      spacing: {
        // Custom spacing tokens
        xs: "2px",
        sm: "8px",
        md: "12px",
        lg: "24px",
        xl: "32px",
        xxl: "96px",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-border": {
          "0%, 100%": {
            borderColor: "rgb(229, 50, 45)",
            boxShadow: "0 0 0 0 rgba(229, 50, 45, 0.7)",
          },
          "50%": {
            borderColor: "rgb(229, 50, 45)",
            boxShadow: "0 0 0 10px rgba(229, 50, 45, 0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 3s ease-in-out infinite",
        "pulse-border": "pulse-border 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
