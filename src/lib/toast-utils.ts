import { toast as sonnerToast } from "sonner";
import { toast as radixToast } from "@/hooks/use-toast";

/**
 * Enhanced toast utilities for top-right notifications
 * Provides consistent API for both Sonner and Radix UI toasts
 */

export interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Success toast - Green theme
 */
export const toastSuccess = (options: ToastOptions | string) => {
  const config = typeof options === 'string' ? { title: options } : options;
  
  // Use Sonner for better UX
  sonnerToast.success(config.title, {
    description: config.description,
    duration: config.duration || 5000,
    action: config.action ? {
      label: config.action.label,
      onClick: config.action.onClick,
    } : undefined,
  });
};

/**
 * Error toast - Red theme
 */
export const toastError = (options: ToastOptions | string) => {
  const config = typeof options === 'string' ? { title: options } : options;
  
  sonnerToast.error(config.title, {
    description: config.description,
    duration: config.duration || 7000, // Longer for errors
    action: config.action ? {
      label: config.action.label,
      onClick: config.action.onClick,
    } : undefined,
  });
};

/**
 * Warning toast - Yellow/Orange theme
 */
export const toastWarning = (options: ToastOptions | string) => {
  const config = typeof options === 'string' ? { title: options } : options;
  
  sonnerToast.warning(config.title, {
    description: config.description,
    duration: config.duration || 6000,
    action: config.action ? {
      label: config.action.label,
      onClick: config.action.onClick,
    } : undefined,
  });
};

/**
 * Info toast - Blue theme
 */
export const toastInfo = (options: ToastOptions | string) => {
  const config = typeof options === 'string' ? { title: options } : options;
  
  sonnerToast.info(config.title, {
    description: config.description,
    duration: config.duration || 5000,
    action: config.action ? {
      label: config.action.label,
      onClick: config.action.onClick,
    } : undefined,
  });
};

/**
 * Loading toast - Shows until dismissed
 */
export const toastLoading = (options: ToastOptions | string) => {
  const config = typeof options === 'string' ? { title: options } : options;
  
  return sonnerToast.loading(config.title, {
    description: config.description,
  });
};

/**
 * Promise toast - Automatically handles loading, success, and error states
 */
export const toastPromise = <T>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) => {
  return sonnerToast.promise(promise, options);
};

/**
 * Custom toast with full control
 */
export const toastCustom = (message: string, options?: {
  description?: string;
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}) => {
  sonnerToast(message, {
    description: options?.description,
    duration: options?.duration || 5000,
    icon: options?.icon,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  });
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  sonnerToast.dismiss();
};

/**
 * Dismiss specific toast by ID
 */
export const dismissToast = (toastId: string | number) => {
  sonnerToast.dismiss(toastId);
};

// Common toast messages for PDF operations
export const pdfToasts = {
  uploadSuccess: (filename: string) => 
    toastSuccess({
      title: "Upload completed!",
      description: `${filename} has been uploaded successfully.`
    }),
    
  uploadError: (error?: string) => 
    toastError({
      title: "Upload failed",
      description: error || "Please try again with a valid PDF file."
    }),
    
  processingStart: (operation: string) => 
    toastLoading(`Processing your PDF... ${operation}`),
    
  processingSuccess: (operation: string) => 
    toastSuccess({
      title: `${operation} completed!`,
      description: "Your file is ready for download."
    }),
    
  processingError: (operation: string, error?: string) => 
    toastError({
      title: `${operation} failed`,
      description: error || "Please try again or contact support."
    }),
    
  downloadReady: () => 
    toastSuccess({
      title: "Download ready!",
      description: "Your processed file is ready to download."
    }),
    
  fileTooLarge: (maxSize: string) => 
    toastWarning({
      title: "File too large",
      description: `Please upload a file smaller than ${maxSize}.`
    }),
    
  invalidFileType: () => 
    toastError({
      title: "Invalid file type",
      description: "Please upload a valid PDF file."
    }),
    
  networkError: () => 
    toastError({
      title: "Network error",
      description: "Please check your connection and try again."
    }),
    
  quotaExceeded: () => 
    toastWarning({
      title: "Usage limit reached",
      description: "Please wait before processing more files."
    }),
};

// Export the main toast function for backward compatibility
export const toast = {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  loading: toastLoading,
  promise: toastPromise,
  custom: toastCustom,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
  
  // PDF-specific shortcuts
  pdf: pdfToasts,
};

export default toast;
