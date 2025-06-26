import { useReducer, useCallback, useRef } from "react";
import {
  EditorState,
  EditorAction,
  AnyElement,
  ToolType,
  Point,
} from "@/types/pdf-editor";

const initialState: EditorState = {
  currentTool: "select",
  selectedElements: [],
  elements: [],
  clipboard: [],
  history: {
    past: [],
    present: [],
    future: [],
  },
  zoom: 1,
  pageIndex: 0,
  canvasSize: { width: 0, height: 0 },
  isDrawing: false,
  currentDrawPath: [],
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_TOOL":
      return {
        ...state,
        currentTool: action.payload as ToolType,
        selectedElements: [],
      };

    case "ADD_ELEMENT":
      const newElement = action.payload as AnyElement;
      const newElements = [...state.elements, newElement];
      return {
        ...state,
        elements: newElements,
        history: {
          past: [...state.history.past, state.history.present],
          present: newElements,
          future: [],
        },
      };

    case "UPDATE_ELEMENT":
      const { id, updates } = action.payload;
      const updatedElements = state.elements.map((el) =>
        el.id === id ? { ...el, ...updates, updatedAt: Date.now() } : el,
      );
      return {
        ...state,
        elements: updatedElements,
        history: {
          past: [...state.history.past, state.history.present],
          present: updatedElements,
          future: [],
        },
      };

    case "DELETE_ELEMENTS":
      const idsToDelete = action.payload as string[];
      const filteredElements = state.elements.filter(
        (el) => !idsToDelete.includes(el.id),
      );
      return {
        ...state,
        elements: filteredElements,
        selectedElements: [],
        history: {
          past: [...state.history.past, state.history.present],
          present: filteredElements,
          future: [],
        },
      };

    case "SELECT_ELEMENTS":
      return {
        ...state,
        selectedElements: action.payload as string[],
      };

    case "TOGGLE_ELEMENT_SELECTION":
      const elementId = action.payload as string;
      const isSelected = state.selectedElements.includes(elementId);
      return {
        ...state,
        selectedElements: isSelected
          ? state.selectedElements.filter((id) => id !== elementId)
          : [...state.selectedElements, elementId],
      };

    case "CLEAR_SELECTION":
      return {
        ...state,
        selectedElements: [],
      };

    case "COPY_ELEMENTS":
      const elementsToCopy = state.elements.filter((el) =>
        state.selectedElements.includes(el.id),
      );
      return {
        ...state,
        clipboard: elementsToCopy,
      };

    case "PASTE_ELEMENTS":
      if (state.clipboard.length === 0) return state;

      const pastedElements = state.clipboard.map((el) => ({
        ...el,
        id: `${el.type}-${Date.now()}-${Math.random()}`,
        bounds: {
          ...el.bounds,
          x: el.bounds.x + 20,
          y: el.bounds.y + 20,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      const newElementsWithPasted = [...state.elements, ...pastedElements];
      return {
        ...state,
        elements: newElementsWithPasted,
        selectedElements: pastedElements.map((el) => el.id),
        history: {
          past: [...state.history.past, state.history.present],
          present: newElementsWithPasted,
          future: [],
        },
      };

    case "UNDO":
      if (state.history.past.length === 0) return state;

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(
        0,
        state.history.past.length - 1,
      );

      return {
        ...state,
        elements: previous,
        history: {
          past: newPast,
          present: previous,
          future: [state.history.present, ...state.history.future],
        },
        selectedElements: [],
      };

    case "REDO":
      if (state.history.future.length === 0) return state;

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);

      return {
        ...state,
        elements: next,
        history: {
          past: [...state.history.past, state.history.present],
          present: next,
          future: newFuture,
        },
        selectedElements: [],
      };

    case "SET_ZOOM":
      return {
        ...state,
        zoom: action.payload as number,
      };

    case "SET_PAGE":
      return {
        ...state,
        pageIndex: action.payload as number,
        selectedElements: [],
      };

    case "SET_CANVAS_SIZE":
      return {
        ...state,
        canvasSize: action.payload,
      };

    case "START_DRAWING":
      return {
        ...state,
        isDrawing: true,
        currentDrawPath: [action.payload as Point],
      };

    case "ADD_DRAW_POINT":
      return {
        ...state,
        currentDrawPath: [...state.currentDrawPath, action.payload as Point],
      };

    case "END_DRAWING":
      return {
        ...state,
        isDrawing: false,
        currentDrawPath: [],
      };

    case "CLEAR_ALL":
      return {
        ...state,
        elements: [],
        selectedElements: [],
        history: {
          past: [...state.history.past, state.history.present],
          present: [],
          future: [],
        },
      };

    default:
      return state;
  }
}

export function usePDFEditor() {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const elementIdCounter = useRef(0);

  const generateElementId = useCallback((type: ToolType) => {
    elementIdCounter.current += 1;
    return `${type}-${Date.now()}-${elementIdCounter.current}`;
  }, []);

  const setTool = useCallback((tool: ToolType) => {
    dispatch({ type: "SET_TOOL", payload: tool });
  }, []);

  const addElement = useCallback(
    (element: Omit<AnyElement, "id" | "createdAt" | "updatedAt">) => {
      const newElement: AnyElement = {
        ...element,
        id: generateElementId(element.type),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as AnyElement;

      dispatch({ type: "ADD_ELEMENT", payload: newElement });
      return newElement.id;
    },
    [generateElementId],
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<AnyElement>) => {
      dispatch({ type: "UPDATE_ELEMENT", payload: { id, updates } });
    },
    [],
  );

  const deleteElements = useCallback((ids: string[]) => {
    dispatch({ type: "DELETE_ELEMENTS", payload: ids });
  }, []);

  const deleteSelectedElements = useCallback(() => {
    dispatch({ type: "DELETE_ELEMENTS", payload: state.selectedElements });
  }, [state.selectedElements]);

  const selectElements = useCallback((ids: string[]) => {
    dispatch({ type: "SELECT_ELEMENTS", payload: ids });
  }, []);

  const toggleElementSelection = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_ELEMENT_SELECTION", payload: id });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" });
  }, []);

  const copyElements = useCallback(() => {
    dispatch({ type: "COPY_ELEMENTS" });
  }, []);

  const pasteElements = useCallback(() => {
    dispatch({ type: "PASTE_ELEMENTS" });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: "SET_ZOOM", payload: zoom });
  }, []);

  const setPage = useCallback((pageIndex: number) => {
    dispatch({ type: "SET_PAGE", payload: pageIndex });
  }, []);

  const setCanvasSize = useCallback(
    (size: { width: number; height: number }) => {
      dispatch({ type: "SET_CANVAS_SIZE", payload: size });
    },
    [],
  );

  const startDrawing = useCallback((point: Point) => {
    dispatch({ type: "START_DRAWING", payload: point });
  }, []);

  const addDrawPoint = useCallback((point: Point) => {
    dispatch({ type: "ADD_DRAW_POINT", payload: point });
  }, []);

  const endDrawing = useCallback(() => {
    dispatch({ type: "END_DRAWING" });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const getElementsOnPage = useCallback(
    (pageIndex: number) => {
      return state.elements.filter((el) => el.pageIndex === pageIndex);
    },
    [state.elements],
  );

  const getSelectedElements = useCallback(() => {
    return state.elements.filter((el) =>
      state.selectedElements.includes(el.id),
    );
  }, [state.elements, state.selectedElements]);

  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;
  const hasSelection = state.selectedElements.length > 0;
  const canPaste = state.clipboard.length > 0;

  return {
    state,
    actions: {
      setTool,
      addElement,
      updateElement,
      deleteElements,
      deleteSelectedElements,
      selectElements,
      toggleElementSelection,
      clearSelection,
      copyElements,
      pasteElements,
      undo,
      redo,
      setZoom,
      setPage,
      setCanvasSize,
      startDrawing,
      addDrawPoint,
      endDrawing,
      clearAll,
    },
    selectors: {
      getElementsOnPage,
      getSelectedElements,
    },
    computed: {
      canUndo,
      canRedo,
      hasSelection,
      canPaste,
    },
  };
}
