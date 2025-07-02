import React, { createContext, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMixpanel } from "@/hooks/useMixpanel";
import { useAuth } from "@/contexts/AuthContext";

// Tool configuration mapping
const TOOL_CONFIGS = {
  // PDF Tools
  "/compress": { name: "compress", category: "PDF Tool", funnel: true },
  "/merge": { name: "merge", category: "PDF Tool", funnel: true },
  "/split": { name: "split", category: "PDF Tool", funnel: true },
  "/word-to-pdf": {
    name: "word-to-pdf",
    category: "Conversion Tool",
    funnel: true,
  },
  "/excel-to-pdf": {
    name: "excel-to-pdf",
    category: "Conversion Tool",
    funnel: true,
  },
  "/powerpoint-to-pdf": {
    name: "powerpoint-to-pdf",
    category: "Conversion Tool",
    funnel: true,
  },
  "/html-to-pdf": {
    name: "html-to-pdf",
    category: "Conversion Tool",
    funnel: true,
  },
  "/pdf-to-word": {
    name: "pdf-to-word",
    category: "Conversion Tool",
    funnel: true,
  },
  "/pdf-to-excel": {
    name: "pdf-to-excel",
    category: "Conversion Tool",
    funnel: true,
  },
  "/pdf-to-powerpoint": {
    name: "pdf-to-powerpoint",
    category: "Conversion Tool",
    funnel: true,
  },
  "/pdf-to-jpg": {
    name: "pdf-to-jpg",
    category: "Conversion Tool",
    funnel: true,
  },
  "/pdf-to-pdfa": {
    name: "pdf-to-pdfa",
    category: "Conversion Tool",
    funnel: true,
  },
  "/img-to-pdf": {
    name: "img-to-pdf",
    category: "Conversion Tool",
    funnel: true,
  },
  "/jpg-to-pdf": {
    name: "jpg-to-pdf",
    category: "Conversion Tool",
    funnel: true,
  },
  "/crop-pdf": { name: "crop-pdf", category: "PDF Editor", funnel: false },
  "/rotate": { name: "rotate", category: "PDF Editor", funnel: false },
  "/rotate-pdf-advanced": {
    name: "rotate-pdf-advanced",
    category: "PDF Editor",
    funnel: false,
  },
  "/watermark": { name: "watermark", category: "PDF Editor", funnel: false },
  "/protect-pdf": {
    name: "protect-pdf",
    category: "PDF Security",
    funnel: false,
  },
  "/unlock-pdf": {
    name: "unlock-pdf",
    category: "PDF Security",
    funnel: false,
  },
  "/sign-pdf": { name: "sign-pdf", category: "PDF Security", funnel: true },
  "/edit-pdf": { name: "edit-pdf", category: "PDF Editor", funnel: true },
  "/enhanced-edit-pdf": {
    name: "enhanced-edit-pdf",
    category: "PDF Editor",
    funnel: true,
  },
  "/advanced-pdf-editor": {
    name: "advanced-pdf-editor",
    category: "PDF Editor",
    funnel: true,
  },
  "/realtime-editor": {
    name: "realtime-editor",
    category: "PDF Editor",
    funnel: true,
  },
  "/page-numbers": {
    name: "page-numbers",
    category: "PDF Editor",
    funnel: false,
  },
  "/organize-pdf": {
    name: "organize-pdf",
    category: "PDF Editor",
    funnel: false,
  },
  "/repair-pdf": { name: "repair-pdf", category: "PDF Utility", funnel: false },
  "/ocr-pdf": { name: "ocr-pdf", category: "PDF OCR", funnel: true },
  "/scan-to-pdf": { name: "scan-to-pdf", category: "PDF OCR", funnel: true },
  "/compare-pdf": {
    name: "compare-pdf",
    category: "PDF Utility",
    funnel: false,
  },
  "/redact-pdf": {
    name: "redact-pdf",
    category: "PDF Security",
    funnel: false,
  },

  // Image Tools
  "/img/compress": {
    name: "img-compress",
    category: "Image Tool",
    funnel: true,
  },
  "/img/resize": { name: "img-resize", category: "Image Tool", funnel: false },
  "/img/jpg-to-png": {
    name: "img-jpg-to-png",
    category: "Image Tool",
    funnel: true,
  },
  "/img/png-to-jpg": {
    name: "img-png-to-jpg",
    category: "Image Tool",
    funnel: true,
  },
  "/img/watermark": {
    name: "img-watermark",
    category: "Image Tool",
    funnel: false,
  },
  "/img/rotate": { name: "img-rotate", category: "Image Tool", funnel: false },
  "/img/crop": { name: "img-crop", category: "Image Tool", funnel: false },
  "/img/remove-bg": {
    name: "img-remove-bg",
    category: "Image Tool",
    funnel: true,
  },
  "/img/upscale": { name: "img-upscale", category: "Image Tool", funnel: true },
  "/img/to-pdf": {
    name: "img-to-pdf",
    category: "Conversion Tool",
    funnel: true,
  },
  "/img/meme": { name: "img-meme", category: "Image Tool", funnel: false },
  "/img/convert": { name: "img-convert", category: "Image Tool", funnel: true },
  "/img/favicon": {
    name: "favicon-converter",
    category: "Image Tool",
    funnel: false,
  },
  "/favicon": {
    name: "favicon-converter",
    category: "Image Tool",
    funnel: false,
  },

  // Utility Pages
  "/convert": { name: "convert", category: "Utility", funnel: false },
  "/pricing": { name: "pricing", category: "Business", funnel: false },
  "/dashboard": { name: "dashboard", category: "Account", funnel: false },
  "/settings": { name: "settings", category: "Account", funnel: false },
};

interface GlobalToolTrackingContextType {
  currentTool: string | null;
  trackFileUpload: (files: File[]) => void;
  trackConversionStart: (
    inputFormat: string,
    outputFormat: string,
    files: File[],
  ) => void;
  trackConversionComplete: (
    inputFormat: string,
    outputFormat: string,
    inputSize: number,
    outputSize: number,
    conversionTime: number,
  ) => void;
  trackConversionError: (
    inputFormat: string,
    outputFormat: string,
    errorMessage: string,
  ) => void;
  trackToolAction: (action: string, properties?: Record<string, any>) => void;
  trackSettingsChange: (setting: string, value: any) => void;
  trackAuthRequired: () => void;
}

const GlobalToolTrackingContext = createContext<
  GlobalToolTrackingContextType | undefined
>(undefined);

interface GlobalToolTrackingProviderProps {
  children: React.ReactNode;
}

export const GlobalToolTrackingProvider: React.FC<
  GlobalToolTrackingProviderProps
> = ({ children }) => {
  const location = useLocation();
  const mixpanel = useMixpanel();
  const { user } = useAuth();

  // Get current tool configuration
  const currentToolConfig =
    TOOL_CONFIGS[location.pathname as keyof typeof TOOL_CONFIGS];
  const currentTool = currentToolConfig?.name || null;

  // Track page view for tools
  useEffect(() => {
    if (currentToolConfig) {
      // Track tool page view
      mixpanel.trackToolUsage(currentToolConfig.name, "page_view", {
        user_type: user ? "authenticated" : "anonymous",
        category: currentToolConfig.category,
        tool_name: currentToolConfig.name,
      });

      // Track funnel start for funnel-enabled tools
      if (currentToolConfig.funnel) {
        mixpanel.trackFunnelStep(currentToolConfig.name, "Page Visited", 1, {
          user_authenticated: !!user,
          tool_category: currentToolConfig.category,
          pathname: location.pathname,
        });
      }
    }
  }, [location.pathname, currentToolConfig, mixpanel, user]);

  const contextValue: GlobalToolTrackingContextType = {
    currentTool,

    trackFileUpload: (files: File[]) => {
      if (!currentTool) return;

      files.forEach((file) => {
        mixpanel.trackFileUpload(file.name, file.size, file.type, currentTool);
      });

      mixpanel.trackToolUsage(currentTool, "file_upload", {
        files_count: files.length,
        total_size: files.reduce((sum, f) => sum + f.size, 0),
        category: currentToolConfig?.category,
      });

      if (currentToolConfig?.funnel) {
        mixpanel.trackFunnelStep(currentTool, "Files Uploaded", 2, {
          files_count: files.length,
        });
      }
    },

    trackConversionStart: (
      inputFormat: string,
      outputFormat: string,
      files: File[],
    ) => {
      if (!currentTool) return;

      if (currentToolConfig?.funnel) {
        mixpanel.trackFunnelStep(currentTool, "Conversion Started", 3, {
          files_count: files.length,
          input_format: inputFormat,
          output_format: outputFormat,
        });
      }

      files.forEach((file) => {
        mixpanel.trackConversionStart(
          inputFormat,
          outputFormat,
          file.name,
          file.size,
        );
      });
    },

    trackConversionComplete: (
      inputFormat: string,
      outputFormat: string,
      inputSize: number,
      outputSize: number,
      conversionTime: number,
    ) => {
      if (!currentTool) return;

      mixpanel.trackConversionComplete(
        inputFormat,
        outputFormat,
        `${currentTool}_file`,
        inputSize,
        outputSize,
        conversionTime,
      );

      if (currentToolConfig?.funnel) {
        mixpanel.trackFunnelStep(currentTool, "Conversion Completed", 4, {
          success: true,
          processing_time: conversionTime,
          output_size: outputSize,
          compression_ratio: outputSize / inputSize,
        });
      }
    },

    trackConversionError: (
      inputFormat: string,
      outputFormat: string,
      errorMessage: string,
    ) => {
      if (!currentTool) return;

      mixpanel.trackConversionError(
        inputFormat,
        outputFormat,
        `${currentTool}_file`,
        0,
        errorMessage,
      );

      if (currentToolConfig?.funnel) {
        mixpanel.trackFunnelStep(currentTool, "Conversion Failed", 4, {
          success: false,
          error_message: errorMessage,
        });
      }
    },

    trackToolAction: (action: string, properties: Record<string, any> = {}) => {
      if (!currentTool) return;

      mixpanel.trackToolUsage(currentTool, action, {
        ...properties,
        category: currentToolConfig?.category,
      });
    },

    trackSettingsChange: (setting: string, value: any) => {
      if (!currentTool) return;

      mixpanel.trackFeatureUsage("settings", "changed", {
        tool_name: currentTool,
        setting_name: setting,
        setting_value: value,
      });
    },

    trackAuthRequired: () => {
      if (!currentTool) return;

      if (currentToolConfig?.funnel) {
        mixpanel.trackFunnelStep(currentTool, "Auth Required", 2, {
          tool_name: currentTool,
        });
      }

      mixpanel.trackToolUsage(currentTool, "auth_required", {
        reason: "tool_usage",
        category: currentToolConfig?.category,
      });
    },
  };

  return (
    <GlobalToolTrackingContext.Provider value={contextValue}>
      {children}
    </GlobalToolTrackingContext.Provider>
  );
};

export const useGlobalToolTracking = (): GlobalToolTrackingContextType => {
  const context = useContext(GlobalToolTrackingContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalToolTracking must be used within a GlobalToolTrackingProvider",
    );
  }
  return context;
};

export default GlobalToolTrackingContext;
