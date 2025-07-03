import mixpanel from "mixpanel-browser";

// Mixpanel configuration
const MIXPANEL_TOKEN = "dbcafd4a36d551e5e028dc20f89fe909";
const MIXPANEL_API_SECRET = "71ee1539dcfb592ca12f07df0e7271e1";

// Initialize Mixpanel for REAL-TIME tracking
mixpanel.init(MIXPANEL_TOKEN, {
  debug: false,
  track_pageview: false,
  persistence: "localStorage",
  ip: false,
  api_host: "https://api.mixpanel.com",
  batch_requests: false,
  batch_size: 1,
  batch_flush_interval_ms: 100,
  cross_subdomain_cookie: false,
  secure_cookie: true,
});

// Event categories
export const EventCategories = {
  PAGE_VIEW: "Page View",
  FILE_INTERACTION: "File Interaction",
  TOOL_USAGE: "Tool Usage",
  CONVERSION_FLOW: "Conversion Flow",
  USER_ACTION: "User Action",
  ERROR: "Error",
  PERFORMANCE: "Performance",
} as const;

// Tool names mapping - Complete list of all tools
export const ToolNames = {
  // PDF Tools
  compress: "PDF Compress",
  merge: "PDF Merge",
  split: "PDF Split",
  "word-to-pdf": "Word to PDF",
  "excel-to-pdf": "Excel to PDF",
  "powerpoint-to-pdf": "PowerPoint to PDF",
  "html-to-pdf": "HTML to PDF",
  "pdf-to-word": "PDF to Word",
  "pdf-to-excel": "PDF to Excel",
  "pdf-to-powerpoint": "PDF to PowerPoint",
  "pdf-to-jpg": "PDF to JPG",
  "pdf-to-pdfa": "PDF to PDF/A",
  "img-to-pdf": "Image to PDF",
  "jpg-to-pdf": "JPG to PDF",
  "crop-pdf": "PDF Crop",
  rotate: "PDF Rotate",
  "rotate-pdf-advanced": "PDF Rotate Advanced",
  watermark: "PDF Watermark",
  "protect-pdf": "PDF Protect",
  "unlock-pdf": "PDF Unlock",
  "sign-pdf": "PDF Sign",
  "edit-pdf": "PDF Edit",
  "enhanced-edit-pdf": "Enhanced PDF Edit",
  "advanced-pdf-editor": "Advanced PDF Editor",
  "realtime-editor": "Realtime PDF Editor",
  "page-numbers": "Add Page Numbers",
  "organize-pdf": "Organize PDF",
  "repair-pdf": "Repair PDF",
  "ocr-pdf": "OCR PDF",
  "scan-to-pdf": "Scan to PDF",
  "compare-pdf": "Compare PDF",
  "redact-pdf": "Redact PDF",

  // Image Tools
  "img-compress": "Image Compress",
  "img-resize": "Image Resize",
  "img-jpg-to-png": "JPG to PNG",
  "img-png-to-jpg": "PNG to JPG",
  "img-watermark": "Image Watermark",
  "img-rotate": "Image Rotate",
  "img-crop": "Image Crop",
  "img-remove-bg": "Remove Background",
  "img-upscale": "Image Upscale",
  "img-meme": "Meme Generator",
  "img-convert": "Image Convert",
  "favicon-converter": "Favicon Converter",

  // Other Tools
  convert: "Convert",
  pricing: "Pricing",
  dashboard: "Dashboard",
  settings: "Settings",
} as const;

export interface EventProperties {
  [key: string]: any;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  pageCount?: number;
  duration?: number;
}

export interface ConversionMetadata extends FileMetadata {
  inputFormat: string;
  outputFormat: string;
  conversionTime?: number;
  outputSize?: number;
  success: boolean;
  errorMessage?: string;
  settings?: Record<string, any>;
}

class MixpanelService {
  private isEnabled: boolean;

  constructor() {
    // Enable in both development and production for real-time tracking
    this.isEnabled = true;
  }

  // Core tracking method for REAL-TIME events
  private track(eventName: string, properties: EventProperties = {}) {
    try {
      const enrichedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        pathname: window.location.pathname,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        session_id: this.getSessionId(),
      };

      mixpanel.track(eventName, enrichedProperties);

      // Note: mixpanel.flush() is not available in mixpanel-browser
      // Events are automatically sent with batch configuration
    } catch (error) {
      console.error("❌ Failed to track event:", error);
    }
  }

  // Generate or get session ID
  private getSessionId(): string {
    let sessionId = localStorage.getItem("mixpanel_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("mixpanel_session_id", sessionId);
    }
    return sessionId;
  }

  // Identify user for REAL-TIME tracking
  identify(userId: string, userProperties: Record<string, any> = {}) {
    try {
      // Identify user immediately
      mixpanel.identify(userId);

      // Set user properties with real-time sync
      const userProps = {
        $email: userProperties.email,
        $name: userProperties.name,
        ...userProperties,
        last_login: new Date().toISOString(),
        session_id: this.getSessionId(),
      };

      mixpanel.people.set(userProps);

      // Note: mixpanel.flush() is not available in mixpanel-browser
      // Events are automatically sent with batch configuration

      this.track("User Identified", {
        user_id: userId,
        identification_timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Silent error handling
    }
  }

  // Reset user identity
  reset() {
    try {
      mixpanel.reset();
    } catch (error) {
      // Silent error handling
    }
  }

  // Page view tracking
  trackPageView(pageName: string, properties: EventProperties = {}) {
    this.track(EventCategories.PAGE_VIEW, {
      page_name: pageName,
      category: EventCategories.PAGE_VIEW,
      ...properties,
    });
  }

  // File interaction tracking
  trackFileUpload(metadata: FileMetadata, toolName: string) {
    this.track("File Uploaded", {
      category: EventCategories.FILE_INTERACTION,
      action: "upload",
      tool_name: toolName,
      file_name: metadata.fileName,
      file_size: metadata.fileSize,
      file_type: metadata.fileType,
      page_count: metadata.pageCount,
    });
  }

  trackFileDownload(metadata: FileMetadata, toolName: string) {
    this.track("File Downloaded", {
      category: EventCategories.FILE_INTERACTION,
      action: "download",
      tool_name: toolName,
      file_name: metadata.fileName,
      file_size: metadata.fileSize,
      file_type: metadata.fileType,
      page_count: metadata.pageCount,
    });
  }

  // Tool usage tracking
  trackToolUsage(
    toolName: string,
    action: string,
    properties: EventProperties = {},
  ) {
    this.track("Tool Used", {
      category: EventCategories.TOOL_USAGE,
      tool_name: ToolNames[toolName as keyof typeof ToolNames] || toolName,
      action,
      ...properties,
    });
  }

  // Conversion flow tracking
  trackConversionStart(metadata: ConversionMetadata) {
    this.track("Conversion Started", {
      category: EventCategories.CONVERSION_FLOW,
      action: "start",
      tool_name: `${metadata.inputFormat} to ${metadata.outputFormat}`,
      input_format: metadata.inputFormat,
      output_format: metadata.outputFormat,
      file_size: metadata.fileSize,
      file_name: metadata.fileName,
      settings: metadata.settings,
    });
  }

  trackConversionComplete(metadata: ConversionMetadata) {
    this.track("Conversion Completed", {
      category: EventCategories.CONVERSION_FLOW,
      action: "complete",
      tool_name: `${metadata.inputFormat} to ${metadata.outputFormat}`,
      input_format: metadata.inputFormat,
      output_format: metadata.outputFormat,
      input_size: metadata.fileSize,
      output_size: metadata.outputSize,
      conversion_time: metadata.conversionTime,
      success: metadata.success,
      file_name: metadata.fileName,
    });
  }

  trackConversionError(metadata: ConversionMetadata) {
    this.track("Conversion Failed", {
      category: EventCategories.CONVERSION_FLOW,
      action: "error",
      tool_name: `${metadata.inputFormat} to ${metadata.outputFormat}`,
      input_format: metadata.inputFormat,
      output_format: metadata.outputFormat,
      file_size: metadata.fileSize,
      error_message: metadata.errorMessage,
      file_name: metadata.fileName,
    });
  }

  // User action tracking
  trackUserSignup(method: string = "email") {
    this.track("User Signed Up", {
      category: EventCategories.USER_ACTION,
      action: "signup",
      method,
    });
  }

  trackUserLogin(method: string = "email") {
    this.track("User Logged In", {
      category: EventCategories.USER_ACTION,
      action: "login",
      method,
    });
  }

  trackUserLogout() {
    this.track("User Logged Out", {
      category: EventCategories.USER_ACTION,
      action: "logout",
    });
  }

  // Error tracking
  trackError(
    errorType: string,
    errorMessage: string,
    context: string = "",
    properties: EventProperties = {},
  ) {
    this.track("Error Occurred", {
      category: EventCategories.ERROR,
      error_type: errorType,
      error_message: errorMessage,
      context,
      ...properties,
    });
  }

  // Performance tracking
  trackPerformance(
    metric: string,
    value: number,
    unit: string = "ms",
    properties: EventProperties = {},
  ) {
    this.track("Performance Metric", {
      category: EventCategories.PERFORMANCE,
      metric,
      value,
      unit,
      ...properties,
    });
  }

  // Feature usage tracking
  trackFeatureUsage(
    feature: string,
    action: string,
    properties: EventProperties = {},
  ) {
    this.track("Feature Used", {
      category: EventCategories.TOOL_USAGE,
      feature,
      action,
      ...properties,
    });
  }

  // Advanced settings tracking
  trackSettingsChange(toolName: string, setting: string, value: any) {
    this.track("Settings Changed", {
      category: EventCategories.TOOL_USAGE,
      tool_name: toolName,
      setting,
      value,
      action: "settings_change",
    });
  }

  // User engagement tracking
  trackEngagement(action: string, properties: EventProperties = {}) {
    this.track("User Engagement", {
      category: EventCategories.USER_ACTION,
      action,
      ...properties,
    });
  }

  // Funnel tracking helpers
  trackFunnelStep(
    funnelName: string,
    step: string,
    stepNumber: number,
    properties: EventProperties = {},
  ) {
    this.track(`${funnelName} - ${step}`, {
      category: EventCategories.CONVERSION_FLOW,
      funnel_name: funnelName,
      step_name: step,
      step_number: stepNumber,
      ...properties,
    });
  }

  // Session tracking
  trackSessionStart() {
    this.track("Session Started", {
      category: EventCategories.USER_ACTION,
      action: "session_start",
    });
  }

  trackSessionEnd(duration: number) {
    this.track("Session Ended", {
      category: EventCategories.USER_ACTION,
      action: "session_end",
      session_duration: duration,
    });
  }
}

// Export singleton instance
export const mixpanelService = new MixpanelService();
export default mixpanelService;
