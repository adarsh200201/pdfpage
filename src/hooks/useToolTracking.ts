import { useEffect, useRef } from "react";
import { useMixpanel } from "./useMixpanel";
import { useAuth } from "@/contexts/AuthContext";

export interface ToolTrackingConfig {
  toolName: string;
  category?: string;
  trackPageView?: boolean;
  trackFunnel?: boolean;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  pageCount?: number;
}

export const useToolTracking = (config: ToolTrackingConfig) => {
  const mixpanel = useMixpanel();
  const { user } = useAuth();
  const hasTrackedPageView = useRef(false);

  // Track page view and funnel start
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      if (config.trackPageView !== false) {
        mixpanel.trackToolUsage(config.toolName, "page_view", {
          user_type: user ? "authenticated" : "anonymous",
          category: config.category || "PDF Tool",
        });
      }

      if (config.trackFunnel) {
        mixpanel.trackFunnelStep(`${config.toolName}`, "Page Visited", 1, {
          user_authenticated: !!user,
          tool_category: config.category || "PDF Tool",
        });
      }

      hasTrackedPageView.current = true;
    }
  }, [
    mixpanel,
    user,
    config.toolName,
    config.category,
    config.trackFunnel,
    config.trackPageView,
  ]);

  // Return tracking methods for the tool
  return {
    // File upload tracking
    trackFileUpload: (files: File[] | FileMetadata[]) => {
      files.forEach((file) => {
        const metadata =
          "name" in file
            ? {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
              }
            : file;

        mixpanel.trackFileUpload(
          metadata.fileName,
          metadata.fileSize,
          metadata.fileType,
          config.toolName,
          metadata.pageCount,
        );
      });

      mixpanel.trackToolUsage(config.toolName, "file_upload", {
        files_count: files.length,
        total_size: files.reduce(
          (sum, f) => sum + ("size" in f ? f.size : f.fileSize),
          0,
        ),
      });

      if (config.trackFunnel) {
        mixpanel.trackFunnelStep(`${config.toolName}`, "Files Uploaded", 2, {
          files_count: files.length,
        });
      }
    },

    // File download tracking
    trackFileDownload: (file: FileMetadata) => {
      mixpanel.trackFileDownload(
        file.fileName,
        file.fileSize,
        file.fileType,
        config.toolName,
        file.pageCount,
      );
    },

    // Tool action tracking
    trackToolAction: (action: string, properties: Record<string, any> = {}) => {
      mixpanel.trackToolUsage(config.toolName, action, {
        ...properties,
        category: config.category || "PDF Tool",
      });
    },

    // Conversion start tracking
    trackConversionStart: (
      inputFormat: string,
      outputFormat: string,
      files: File[] | FileMetadata[],
    ) => {
      if (config.trackFunnel) {
        mixpanel.trackFunnelStep(
          `${config.toolName}`,
          "Conversion Started",
          3,
          {
            files_count: files.length,
            input_format: inputFormat,
            output_format: outputFormat,
          },
        );
      }

      files.forEach((file) => {
        const metadata =
          "name" in file
            ? {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
              }
            : file;

        mixpanel.trackConversionStart(
          inputFormat,
          outputFormat,
          metadata.fileName,
          metadata.fileSize,
        );
      });
    },

    // Conversion complete tracking
    trackConversionComplete: (
      inputFormat: string,
      outputFormat: string,
      inputFile: FileMetadata,
      outputSize: number,
      conversionTime: number,
    ) => {
      mixpanel.trackConversionComplete(
        inputFormat,
        outputFormat,
        inputFile.fileName,
        inputFile.fileSize,
        outputSize,
        conversionTime,
      );

      if (config.trackFunnel) {
        mixpanel.trackFunnelStep(
          `${config.toolName}`,
          "Conversion Completed",
          4,
          {
            success: true,
            processing_time: conversionTime,
            output_size: outputSize,
          },
        );
      }
    },

    // Conversion error tracking
    trackConversionError: (
      inputFormat: string,
      outputFormat: string,
      file: FileMetadata,
      errorMessage: string,
    ) => {
      mixpanel.trackConversionError(
        inputFormat,
        outputFormat,
        file.fileName,
        file.fileSize,
        errorMessage,
      );

      if (config.trackFunnel) {
        mixpanel.trackFunnelStep(`${config.toolName}`, "Conversion Failed", 4, {
          success: false,
          error_message: errorMessage,
        });
      }
    },

    // Settings change tracking
    trackSettingsChange: (setting: string, value: any) => {
      mixpanel.trackFeatureUsage("settings", "changed", {
        tool_name: config.toolName,
        setting_name: setting,
        setting_value: value,
      });
    },

    // Feature usage tracking
    trackFeatureUsage: (
      feature: string,
      action: string,
      properties: Record<string, any> = {},
    ) => {
      mixpanel.trackFeatureUsage(feature, action, {
        ...properties,
        tool_name: config.toolName,
      });
    },

    // Error tracking
    trackError: (errorType: string, errorMessage: string, context?: string) => {
      mixpanel.trackError(errorType, errorMessage, context || config.toolName, {
        tool_name: config.toolName,
      });
    },

    // Auth required tracking
    trackAuthRequired: () => {
      if (config.trackFunnel) {
        mixpanel.trackFunnelStep(`${config.toolName}`, "Auth Required", 2, {
          tool_name: config.toolName,
        });
      }

      mixpanel.trackToolUsage(config.toolName, "auth_required", {
        reason: "tool_usage",
      });
    },

    // Generic event tracking
    trackEvent: (eventName: string, properties: Record<string, any> = {}) => {
      mixpanel.trackToolUsage(config.toolName, eventName, {
        ...properties,
        category: config.category || "PDF Tool",
      });
    },
  };
};

export default useToolTracking;
