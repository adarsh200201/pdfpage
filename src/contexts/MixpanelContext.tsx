import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import mixpanelService, { EventProperties } from "@/services/mixpanelService";

interface MixpanelContextType {
  trackPageView: (pageName: string, properties?: EventProperties) => void;
  trackFileUpload: (
    fileName: string,
    fileSize: number,
    fileType: string,
    toolName: string,
    pageCount?: number,
  ) => void;
  trackFileDownload: (
    fileName: string,
    fileSize: number,
    fileType: string,
    toolName: string,
    pageCount?: number,
  ) => void;
  trackToolUsage: (
    toolName: string,
    action: string,
    properties?: EventProperties,
  ) => void;
  trackConversionStart: (
    inputFormat: string,
    outputFormat: string,
    fileName: string,
    fileSize: number,
    settings?: Record<string, any>,
  ) => void;
  trackConversionComplete: (
    inputFormat: string,
    outputFormat: string,
    fileName: string,
    inputSize: number,
    outputSize: number,
    conversionTime: number,
  ) => void;
  trackConversionError: (
    inputFormat: string,
    outputFormat: string,
    fileName: string,
    fileSize: number,
    errorMessage: string,
  ) => void;
  trackError: (
    errorType: string,
    errorMessage: string,
    context?: string,
    properties?: EventProperties,
  ) => void;
  trackFeatureUsage: (
    feature: string,
    action: string,
    properties?: EventProperties,
  ) => void;
  trackEngagement: (action: string, properties?: EventProperties) => void;
  trackFunnelStep: (
    funnelName: string,
    step: string,
    stepNumber: number,
    properties?: EventProperties,
  ) => void;
  identifyUser: (userId: string, userProperties?: Record<string, any>) => void;
  resetUser: () => void;
}

const MixpanelContext = createContext<MixpanelContextType | undefined>(
  undefined,
);

interface MixpanelProviderProps {
  children: ReactNode;
}

// Page name mapping for better tracking
const getPageName = (pathname: string): string => {
  const pathMap: Record<string, string> = {
    "/": "Home",
    "/compress": "PDF Compress",
    "/merge": "PDF Merge",
    "/split": "PDF Split",
    "/word-to-pdf": "Word to PDF",
    "/excel-to-pdf": "Excel to PDF",
    "/pdf-to-word": "PDF to Word",
    "/pdf-to-excel": "PDF to Excel",
    "/pdf-to-jpg": "PDF to JPG",
    "/img-to-pdf": "Image to PDF",
    "/crop-pdf": "PDF Crop",
    "/rotate": "PDF Rotate",
    "/watermark": "PDF Watermark",
    "/protect-pdf": "PDF Protect",
    "/unlock-pdf": "PDF Unlock",
    "/edit-pdf": "PDF Edit",
    "/page-numbers": "Add Page Numbers",
    "/organize-pdf": "Organize PDF",
    "/repair-pdf": "Repair PDF",
    "/about": "About",
    "/contact": "Contact",
    "/pricing": "Pricing",
    "/login": "Login",
    "/register": "Register",
    "/dashboard": "Dashboard",
    "/settings": "Settings",
  };

  return pathMap[pathname] || pathname.replace("/", "").replace("-", " ");
};

export const MixpanelProvider: React.FC<MixpanelProviderProps> = ({
  children,
}) => {
  const location = useLocation();

  // Track page views automatically
  useEffect(() => {
    const pageName = getPageName(location.pathname);
    mixpanelService.trackPageView(pageName, {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  }, [location]);

  // Track session start on mount
  useEffect(() => {
    mixpanelService.trackSessionStart();

    // Track session duration on unmount
    const sessionStartTime = Date.now();
    return () => {
      const sessionDuration = Date.now() - sessionStartTime;
      mixpanelService.trackSessionEnd(sessionDuration);
    };
  }, []);

  const contextValue: MixpanelContextType = {
    trackPageView: (pageName: string, properties?: EventProperties) => {
      mixpanelService.trackPageView(pageName, properties);
    },

    trackFileUpload: (
      fileName: string,
      fileSize: number,
      fileType: string,
      toolName: string,
      pageCount?: number,
    ) => {
      mixpanelService.trackFileUpload(
        { fileName, fileSize, fileType, pageCount },
        toolName,
      );
    },

    trackFileDownload: (
      fileName: string,
      fileSize: number,
      fileType: string,
      toolName: string,
      pageCount?: number,
    ) => {
      mixpanelService.trackFileDownload(
        { fileName, fileSize, fileType, pageCount },
        toolName,
      );
    },

    trackToolUsage: (
      toolName: string,
      action: string,
      properties?: EventProperties,
    ) => {
      mixpanelService.trackToolUsage(toolName, action, properties);
    },

    trackConversionStart: (
      inputFormat: string,
      outputFormat: string,
      fileName: string,
      fileSize: number,
      settings?: Record<string, any>,
    ) => {
      mixpanelService.trackConversionStart({
        inputFormat,
        outputFormat,
        fileName,
        fileSize,
        fileType: inputFormat,
        success: false, // Not applicable for start
        settings,
      });
    },

    trackConversionComplete: (
      inputFormat: string,
      outputFormat: string,
      fileName: string,
      inputSize: number,
      outputSize: number,
      conversionTime: number,
    ) => {
      mixpanelService.trackConversionComplete({
        inputFormat,
        outputFormat,
        fileName,
        fileSize: inputSize,
        fileType: inputFormat,
        outputSize,
        conversionTime,
        success: true,
      });
    },

    trackConversionError: (
      inputFormat: string,
      outputFormat: string,
      fileName: string,
      fileSize: number,
      errorMessage: string,
    ) => {
      mixpanelService.trackConversionError({
        inputFormat,
        outputFormat,
        fileName,
        fileSize,
        fileType: inputFormat,
        success: false,
        errorMessage,
      });
    },

    trackError: (
      errorType: string,
      errorMessage: string,
      context?: string,
      properties?: EventProperties,
    ) => {
      mixpanelService.trackError(errorType, errorMessage, context, properties);
    },

    trackFeatureUsage: (
      feature: string,
      action: string,
      properties?: EventProperties,
    ) => {
      mixpanelService.trackFeatureUsage(feature, action, properties);
    },

    trackEngagement: (action: string, properties?: EventProperties) => {
      mixpanelService.trackEngagement(action, properties);
    },

    trackFunnelStep: (
      funnelName: string,
      step: string,
      stepNumber: number,
      properties?: EventProperties,
    ) => {
      mixpanelService.trackFunnelStep(funnelName, step, stepNumber, properties);
    },

    identifyUser: (userId: string, userProperties?: Record<string, any>) => {
      mixpanelService.identify(userId, userProperties);
    },

    resetUser: () => {
      mixpanelService.reset();
    },
  };

  return (
    <MixpanelContext.Provider value={contextValue}>
      {children}
    </MixpanelContext.Provider>
  );
};

export const useMixpanel = (): MixpanelContextType => {
  const context = useContext(MixpanelContext);
  if (context === undefined) {
    throw new Error("useMixpanel must be used within a MixpanelProvider");
  }
  return context;
};

export default MixpanelContext;
