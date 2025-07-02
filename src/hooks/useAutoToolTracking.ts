import { useGlobalToolTracking } from "@/contexts/GlobalToolTrackingContext";

/**
 * Simple hook that provides automatic tracking for any tool page
 * Just import and use - no configuration needed!
 *
 * Usage:
 * ```typescript
 * import { useAutoToolTracking } from "@/hooks/useAutoToolTracking";
 *
 * const MyTool = () => {
 *   const track = useAutoToolTracking();
 *
 *   const handleFileUpload = (files: File[]) => {
 *     track.fileUpload(files);
 *     // ... rest of logic
 *   };
 *
 *   const handleConvert = async () => {
 *     track.conversionStart("PDF", "Word", files);
 *     try {
 *       // ... conversion logic
 *       track.conversionComplete("PDF", "Word", inputSize, outputSize, time);
 *     } catch (error) {
 *       track.conversionError("PDF", "Word", error.message);
 *     }
 *   };
 * };
 * ```
 */
export const useAutoToolTracking = () => {
  const globalTracking = useGlobalToolTracking();

  return {
    // File operations
    fileUpload: (files: File[]) => {
      globalTracking.trackFileUpload(files);
    },

    // Conversion tracking
    conversionStart: (
      inputFormat: string,
      outputFormat: string,
      files: File[],
    ) => {
      globalTracking.trackConversionStart(inputFormat, outputFormat, files);
    },

    conversionComplete: (
      inputFormat: string,
      outputFormat: string,
      inputSize: number,
      outputSize: number,
      conversionTime: number,
    ) => {
      globalTracking.trackConversionComplete(
        inputFormat,
        outputFormat,
        inputSize,
        outputSize,
        conversionTime,
      );
    },

    conversionError: (
      inputFormat: string,
      outputFormat: string,
      errorMessage: string,
    ) => {
      globalTracking.trackConversionError(
        inputFormat,
        outputFormat,
        errorMessage,
      );
    },

    // User actions
    authRequired: () => {
      globalTracking.trackAuthRequired();
    },

    // Tool actions
    action: (actionName: string, properties?: Record<string, any>) => {
      globalTracking.trackToolAction(actionName, properties);
    },

    // Settings
    settingsChange: (setting: string, value: any) => {
      globalTracking.trackSettingsChange(setting, value);
    },

    // Generic events
    event: (eventName: string, properties?: Record<string, any>) => {
      globalTracking.trackToolAction(eventName, properties);
    },
  };
};

export default useAutoToolTracking;
