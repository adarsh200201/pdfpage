import { useState, useCallback, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { v4 as uuidv4 } from "uuid";
import { pdfEditorService } from "@/services/pdfEditorService";

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ToolType =
  | "select"
  | "text"
  | "draw"
  | "rectangle"
  | "circle"
  | "image"
  | "signature";

export interface BaseElement {
  id: string;
  type: ToolType;
  pageIndex: number;
  bounds: Bounds;
  createdAt: number;
  updatedAt: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  rotation: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface DrawElement extends BaseElement {
  type: "draw";
  path: Point[];
  strokeWidth: number;
  strokeColor: string;
  smooth: boolean;
}

export interface ShapeElement extends BaseElement {
  type: "rectangle" | "circle";
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  filled: boolean;
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
}

export interface SignatureElement extends BaseElement {
  type: "signature";
  signatureData: string; // Base64 encoded signature
  signedBy: string;
  signedAt: number;
}

export type PDFElement =
  | TextElement
  | DrawElement
  | ShapeElement
  | ImageElement
  | SignatureElement;

export interface EditorSettings {
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  showRulers: boolean;
  autoSave: boolean;
  defaultFontSize: number;
  defaultFontFamily: string;
  defaultStrokeWidth: number;
  defaultStrokeColor: string;
  defaultFillColor: string;
  defaultTextColor: string;
}

export interface HistoryEntry {
  id: string;
  action: string;
  elements: PDFElement[];
  timestamp: number;
}

export interface PDFEditorState {
  pdfDocument: PDFDocumentProxy | null;
  pages: PDFPageProxy[];
  currentPage: number;
  totalPages: number;
  zoom: number;
  elements: PDFElement[];
  selectedElements: string[];
  currentTool: ToolType;
  isDrawing: boolean;
  currentDrawPath: Point[];
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  settings: EditorSettings;
  pageSize: { width: number; height: number };
}

const defaultSettings: EditorSettings = {
  snapToGrid: false,
  gridSize: 20,
  showGrid: false,
  showRulers: false,
  autoSave: true,
  defaultFontSize: 14,
  defaultFontFamily: "Arial",
  defaultStrokeWidth: 2,
  defaultStrokeColor: "#000000",
  defaultFillColor: "#ffffff",
  defaultTextColor: "#000000",
};

export function usePDFEditor() {
  const [state, setState] = useState<PDFEditorState>({
    pdfDocument: null,
    pages: [],
    currentPage: 1,
    totalPages: 0,
    zoom: 1,
    elements: [],
    selectedElements: [],
    currentTool: "select",
    isDrawing: false,
    currentDrawPath: [],
    history: [],
    historyIndex: -1,
    canUndo: false,
    canRedo: false,
    settings: defaultSettings,
    pageSize: { width: 0, height: 0 },
  });

  const addToHistory = useCallback((action: string, elements: PDFElement[]) => {
    setState((prev) => {
      const newEntry: HistoryEntry = {
        id: uuidv4(),
        action,
        elements: JSON.parse(JSON.stringify(elements)),
        timestamp: Date.now(),
      };

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newEntry);

      // Limit history to 50 entries
      if (newHistory.length > 50) {
        newHistory.shift();
      }

      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        canUndo: true,
        canRedo: false,
      };
    });
  }, []);

  // Load PDF document
  const loadPDF = useCallback(async (file: File) => {
    try {
      console.log("Loading PDF file:", file.name, "Size:", file.size);
      const { pdfDocument } = await pdfEditorService.loadPDF(file);
      console.log("PDF loaded successfully, pages:", pdfDocument.numPages);

      const pages: PDFPageProxy[] = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        pages.push(page);
      }

      const firstPage = pages[0];
      const viewport = firstPage.getViewport({ scale: 1 });
      console.log("Page viewport:", viewport.width, "x", viewport.height);

      setState((prev) => ({
        ...prev,
        pdfDocument,
        pages,
        totalPages: pdfDocument.numPages,
        currentPage: 1,
        pageSize: {
          width: viewport.width,
          height: viewport.height,
        },
        elements: [],
        selectedElements: [],
        history: [],
        historyIndex: -1,
        canUndo: false,
        canRedo: false,
      }));

      console.log("PDF state updated successfully");
    } catch (error) {
      console.error("Error loading PDF:", error);
      throw error;
    }
  }, []);

  // Tool management
  const setTool = useCallback((tool: ToolType) => {
    setState((prev) => ({
      ...prev,
      currentTool: tool,
      selectedElements: tool === "select" ? prev.selectedElements : [],
    }));
  }, []);

  // Zoom management
  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, zoom)),
    }));
  }, []);

  // Page navigation
  const setPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      currentPage: Math.max(1, Math.min(prev.totalPages, page)),
      selectedElements: [], // Clear selection when changing pages
    }));
  }, []);

  // Element management
  const addElement = useCallback(
    (element: Omit<PDFElement, "id" | "createdAt" | "updatedAt">) => {
      const newElement: PDFElement = {
        ...element,
        id: uuidv4(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as PDFElement;

      setState((prev) => {
        const newElements = [...prev.elements, newElement];
        addToHistory("add", newElements);
        return {
          ...prev,
          elements: newElements,
          selectedElements: [newElement.id],
        };
      });

      return newElement.id;
    },
    [addToHistory],
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<PDFElement>) => {
      setState((prev) => {
        const newElements = prev.elements.map((el) =>
          el.id === id ? { ...el, ...updates, updatedAt: Date.now() } : el,
        );
        addToHistory("update", newElements);
        return {
          ...prev,
          elements: newElements,
        };
      });
    },
    [addToHistory],
  );

  const deleteElements = useCallback(
    (ids: string[]) => {
      setState((prev) => {
        const newElements = prev.elements.filter((el) => !ids.includes(el.id));
        addToHistory("delete", newElements);
        return {
          ...prev,
          elements: newElements,
          selectedElements: prev.selectedElements.filter(
            (id) => !ids.includes(id),
          ),
        };
      });
    },
    [addToHistory],
  );

  const duplicateElements = useCallback(
    (ids: string[]) => {
      setState((prev) => {
        const elementsToDuplicate = prev.elements.filter((el) =>
          ids.includes(el.id),
        );
        const duplicatedElements = elementsToDuplicate.map((el) => ({
          ...el,
          id: uuidv4(),
          bounds: {
            ...el.bounds,
            x: el.bounds.x + 20,
            y: el.bounds.y + 20,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));

        const newElements = [...prev.elements, ...duplicatedElements];
        addToHistory("duplicate", newElements);
        return {
          ...prev,
          elements: newElements,
          selectedElements: duplicatedElements.map((el) => el.id),
        };
      });
    },
    [addToHistory],
  );

  // Selection management
  const selectElements = useCallback((ids: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedElements: ids,
    }));
  }, []);

  const toggleSelectElement = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      selectedElements: prev.selectedElements.includes(id)
        ? prev.selectedElements.filter((selectedId) => selectedId !== id)
        : [...prev.selectedElements, id],
    }));
  }, []);

  // Drawing management
  const startDrawing = useCallback((point: Point) => {
    setState((prev) => ({
      ...prev,
      isDrawing: true,
      currentDrawPath: [point],
    }));
  }, []);

  const addDrawPoint = useCallback((point: Point) => {
    setState((prev) => ({
      ...prev,
      currentDrawPath: [...prev.currentDrawPath, point],
    }));
  }, []);

  const endDrawing = useCallback(() => {
    setState((prev) => {
      if (prev.currentDrawPath.length < 2) {
        return {
          ...prev,
          isDrawing: false,
          currentDrawPath: [],
        };
      }

      // Create a draw element from the current path
      const bounds = prev.currentDrawPath.reduce(
        (acc, point) => ({
          x: Math.min(acc.x, point.x),
          y: Math.min(acc.y, point.y),
          width: Math.max(acc.width, point.x - acc.x),
          height: Math.max(acc.height, point.y - acc.y),
        }),
        { x: Infinity, y: Infinity, width: 0, height: 0 },
      );

      const drawElement: Omit<DrawElement, "id" | "createdAt" | "updatedAt"> = {
        type: "draw",
        pageIndex: prev.currentPage - 1,
        bounds,
        visible: true,
        locked: false,
        opacity: 1,
        rotation: 0,
        path: prev.currentDrawPath,
        strokeWidth: prev.settings.defaultStrokeWidth,
        strokeColor: prev.settings.defaultStrokeColor,
        smooth: true,
      };

      const newElement: DrawElement = {
        ...drawElement,
        id: uuidv4(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newElements = [...prev.elements, newElement];
      addToHistory("draw", newElements);

      return {
        ...prev,
        elements: newElements,
        isDrawing: false,
        currentDrawPath: [],
        selectedElements: [newElement.id],
      };
    });
  }, [addToHistory]);

  // History management
  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex <= 0) return prev;

      const previousEntry = prev.history[prev.historyIndex - 1];
      return {
        ...prev,
        elements: JSON.parse(JSON.stringify(previousEntry.elements)),
        historyIndex: prev.historyIndex - 1,
        canUndo: prev.historyIndex > 1,
        canRedo: true,
        selectedElements: [],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;

      const nextEntry = prev.history[prev.historyIndex + 1];
      return {
        ...prev,
        elements: JSON.parse(JSON.stringify(nextEntry.elements)),
        historyIndex: prev.historyIndex + 1,
        canUndo: true,
        canRedo: prev.historyIndex + 1 < prev.history.length - 1,
        selectedElements: [],
      };
    });
  }, []);

  // Settings management
  const updateSettings = useCallback((updates: Partial<EditorSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  // Page size management
  const setPageSize = useCallback((size: { width: number; height: number }) => {
    setState((prev) => ({
      ...prev,
      pageSize: size,
    }));
  }, []);

  // Export PDF
  const exportPDF = useCallback(async (): Promise<Uint8Array> => {
    if (!state.pdfDocument) {
      throw new Error("No PDF document loaded");
    }

    return await pdfEditorService.exportPDF(state.elements);
  }, [state.pdfDocument, state.elements]);

  return {
    // State
    pdfDocument: state.pdfDocument,
    pages: state.pages,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    zoom: state.zoom,
    elements: state.elements,
    selectedElements: state.selectedElements,
    currentTool: state.currentTool,
    isDrawing: state.isDrawing,
    currentDrawPath: state.currentDrawPath,
    history: state.history,
    historyIndex: state.historyIndex,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    settings: state.settings,
    pageSize: state.pageSize,

    // Actions
    actions: {
      loadPDF,
      setTool,
      setZoom,
      setPage,
      addElement,
      updateElement,
      deleteElements,
      duplicateElements,
      selectElements,
      toggleSelectElement,
      startDrawing,
      addDrawPoint,
      endDrawing,
      undo,
      redo,
      updateSettings,
      setPageSize,
      exportPDF,
    },
  };
}
