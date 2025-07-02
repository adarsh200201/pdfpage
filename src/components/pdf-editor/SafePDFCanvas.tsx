import React, { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface SafePDFCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onCanvasError?: (error: Error) => void;
  children?: React.ReactNode;
}

/**
 * SafePDFCanvas - A robust canvas component that handles ref safety
 * and prevents common canvas-related errors in PDF editing
 */
export const SafePDFCanvas = React.forwardRef<any, SafePDFCanvasProps>(
  function SafePDFCanvas(
    {
      width = 800,
      height = 600,
      className,
      onCanvasReady,
      onCanvasError,
      children,
    }: SafePDFCanvasProps,
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Safe canvas access with error handling
    const getCanvas = useCallback((): HTMLCanvasElement | null => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          console.warn("Canvas ref is null - canvas may not be mounted yet");
          return null;
        }
        return canvas;
      } catch (error) {
        console.error("Error accessing canvas:", error);
        setError(error as Error);
        onCanvasError?.(error as Error);
        return null;
      }
    }, [onCanvasError]);

    // Safe context access with error handling
    const getContext = useCallback(
      (
        type: "2d" | "webgl" = "2d",
      ): CanvasRenderingContext2D | WebGLRenderingContext | null => {
        try {
          const canvas = getCanvas();
          if (!canvas) return null;

          const context = canvas.getContext(type);
          if (!context) {
            const error = new Error(
              `Failed to get ${type} context from canvas`,
            );
            setError(error);
            onCanvasError?.(error);
            return null;
          }

          return context;
        } catch (error) {
          console.error("Error getting canvas context:", error);
          setError(error as Error);
          onCanvasError?.(error as Error);
          return null;
        }
      },
      [getCanvas, onCanvasError],
    );

    // Canvas initialization with error boundary
    useEffect(() => {
      const initializeCanvas = async () => {
        try {
          // Wait for next tick to ensure DOM is ready
          await new Promise((resolve) => setTimeout(resolve, 0));

          const canvas = getCanvas();
          if (!canvas) {
            console.warn("Canvas not ready during initialization");
            return;
          }

          // Set canvas dimensions safely
          canvas.width = width;
          canvas.height = height;

          // Test context creation
          const context = getContext("2d");
          if (!context) {
            throw new Error("Failed to create 2D context");
          }

          // Clear canvas to ensure it's working
          context.clearRect(0, 0, width, height);

          setIsCanvasReady(true);
          setError(null);
          onCanvasReady?.(canvas);

          console.log("Canvas initialized successfully:", { width, height });
        } catch (error) {
          console.error("Canvas initialization failed:", error);
          setError(error as Error);
          setIsCanvasReady(false);
          onCanvasError?.(error as Error);
        }
      };

      initializeCanvas();
    }, [width, height, getCanvas, getContext, onCanvasReady, onCanvasError]);

    // Handle canvas resize
    const handleResize = useCallback(
      (newWidth: number, newHeight: number) => {
        try {
          const canvas = getCanvas();
          if (!canvas) return;

          canvas.width = newWidth;
          canvas.height = newHeight;

          // Clear after resize
          const context = getContext("2d");
          if (context) {
            context.clearRect(0, 0, newWidth, newHeight);
          }
        } catch (error) {
          console.error("Canvas resize failed:", error);
          setError(error as Error);
          onCanvasError?.(error as Error);
        }
      },
      [getCanvas, getContext, onCanvasError],
    );

    // Clear canvas safely
    const clearCanvas = useCallback(() => {
      try {
        const context = getContext("2d");
        if (context) {
          context.clearRect(0, 0, width, height);
        }
      } catch (error) {
        console.error("Canvas clear failed:", error);
        setError(error as Error);
        onCanvasError?.(error as Error);
      }
    }, [getContext, width, height, onCanvasError]);

    // Expose safe canvas methods
    const canvasMethods = {
      getCanvas,
      getContext,
      handleResize,
      clearCanvas,
      isReady: isCanvasReady,
      error,
    };

    // Use imperative handle to expose methods to parent
    React.useImperativeHandle(ref, () => canvasMethods, [canvasMethods]);

    return (
      <div className="relative">
        <canvas
          ref={canvasRef}
          className={cn(
            "block border border-gray-300 shadow-lg bg-white",
            !isCanvasReady && "opacity-50",
            className,
          )}
          width={width}
          height={height}
          onError={(e) => {
            console.error("Canvas error event:", e);
            setError(new Error("Canvas error event"));
          }}
        />

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 border border-red-200 rounded">
            <div className="text-red-600 text-center p-4">
              <p className="font-medium">Canvas Error</p>
              <p className="text-sm">{error.message}</p>
              <button
                onClick={() => {
                  setError(null);
                  setIsCanvasReady(false);
                  // Retry initialization
                  setTimeout(() => {
                    const canvas = getCanvas();
                    if (canvas) {
                      onCanvasReady?.(canvas);
                    }
                  }, 100);
                }}
                className="mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {!isCanvasReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 border border-gray-200 rounded">
            <div className="text-gray-600 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-2" />
              <p className="text-sm">Initializing canvas...</p>
            </div>
          </div>
        )}

        {/* Render children with canvas methods */}
        {children &&
          React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child, { canvasMethods } as any)
              : child,
          )}
      </div>
    );
  },
);

export default SafePDFCanvas;
