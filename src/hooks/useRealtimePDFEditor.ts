import { useState, useEffect, useCallback, useRef } from "react";
import { createSelector } from "reselect";
import { v4 as uuidv4 } from "uuid";
import { AnyElement, EditorState, ToolType } from "@/types/pdf-editor";

interface CollaborativeState extends EditorState {
  sessionId: string;
  userId: string;
  collaborators: Array<{
    id: string;
    name: string;
    color: string;
    cursor?: { x: number; y: number; pageIndex: number };
    lastSeen: number;
  }>;
  version: number;
  operations: Operation[];
}

interface Operation {
  id: string;
  type: "add" | "update" | "delete" | "select" | "cursor";
  elementId?: string;
  data: any;
  timestamp: number;
  userId: string;
  version: number;
}

interface RealtimeConnection {
  send: (operation: Operation) => void;
  onReceive: (callback: (operation: Operation) => void) => void;
  disconnect: () => void;
}

// Selectors for performance optimization
const selectElements = (state: CollaborativeState) => state.elements;
const selectSelectedElements = (state: CollaborativeState) =>
  state.selectedElements;
const selectCurrentTool = (state: CollaborativeState) => state.currentTool;
const selectZoom = (state: CollaborativeState) => state.zoom;
const selectPageIndex = (state: CollaborativeState) => state.pageIndex;

const selectElementsById = createSelector([selectElements], (elements) =>
  elements.reduce(
    (acc, el) => ({ ...acc, [el.id]: el }),
    {} as Record<string, AnyElement>,
  ),
);

const selectElementsByPage = createSelector(
  [selectElements, selectPageIndex],
  (elements, pageIndex) => elements.filter((el) => el.pageIndex === pageIndex),
);

export function useRealtimePDFEditor(sessionId?: string) {
  const [state, setState] = useState<CollaborativeState>({
    sessionId: sessionId || uuidv4(),
    userId: uuidv4(),
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
    collaborators: [],
    version: 0,
    operations: [],
  });

  const connectionRef = useRef<RealtimeConnection | null>(null);
  const operationQueueRef = useRef<Operation[]>([]);
  const isApplyingOperationRef = useRef(false);

  // Mock WebSocket connection - replace with actual implementation
  useEffect(() => {
    // This would be replaced with actual WebSocket or WebRTC connection
    const mockConnection: RealtimeConnection = {
      send: (operation) => {
        console.log("Sending operation:", operation);
        // Simulate network delay and echo back for demo
        setTimeout(
          () => {
            if (Math.random() > 0.1) {
              // 90% success rate
              receiveOperation(operation);
            }
          },
          50 + Math.random() * 100,
        );
      },
      onReceive: (callback) => {
        // Mock implementation
      },
      disconnect: () => {
        // Cleanup
      },
    };

    connectionRef.current = mockConnection;

    return () => {
      if (connectionRef.current) {
        connectionRef.current.disconnect();
      }
    };
  }, [state.sessionId]);

  const sendOperation = useCallback(
    (operation: Omit<Operation, "id" | "timestamp" | "userId" | "version">) => {
      if (!connectionRef.current) return;

      const fullOperation: Operation = {
        ...operation,
        id: uuidv4(),
        timestamp: Date.now(),
        userId: state.userId,
        version: state.version + 1,
      };

      connectionRef.current.send(fullOperation);
      return fullOperation;
    },
    [state.userId, state.version],
  );

  const receiveOperation = useCallback(
    (operation: Operation) => {
      if (operation.userId === state.userId) return; // Ignore own operations

      operationQueueRef.current.push(operation);
      processOperationQueue();
    },
    [state.userId],
  );

  const processOperationQueue = useCallback(() => {
    if (
      isApplyingOperationRef.current ||
      operationQueueRef.current.length === 0
    ) {
      return;
    }

    isApplyingOperationRef.current = true;

    const operation = operationQueueRef.current.shift()!;

    setState((prevState) => {
      const newState = { ...prevState };

      switch (operation.type) {
        case "add":
          newState.elements = [...prevState.elements, operation.data];
          break;

        case "update":
          newState.elements = prevState.elements.map((el) =>
            el.id === operation.elementId ? { ...el, ...operation.data } : el,
          );
          break;

        case "delete":
          newState.elements = prevState.elements.filter(
            (el) => el.id !== operation.elementId,
          );
          newState.selectedElements = prevState.selectedElements.filter(
            (id) => id !== operation.elementId,
          );
          break;

        case "select":
          // Update collaborator selection (visual feedback only)
          break;

        case "cursor":
          newState.collaborators = prevState.collaborators.map(
            (collaborator) =>
              collaborator.id === operation.userId
                ? {
                    ...collaborator,
                    cursor: operation.data,
                    lastSeen: operation.timestamp,
                  }
                : collaborator,
          );
          break;
      }

      newState.version = Math.max(prevState.version, operation.version);
      newState.operations = [...prevState.operations, operation].slice(-100); // Keep last 100 operations

      return newState;
    });

    isApplyingOperationRef.current = false;

    // Process next operation if any
    if (operationQueueRef.current.length > 0) {
      setTimeout(processOperationQueue, 0);
    }
  }, []);

  // Actions
  const actions = {
    setTool: useCallback((tool: ToolType) => {
      setState((prev) => ({ ...prev, currentTool: tool }));
    }, []),

    addElement: useCallback(
      (element: AnyElement) => {
        const operation = sendOperation({
          type: "add",
          data: element,
        });

        if (operation) {
          setState((prev) => ({
            ...prev,
            elements: [...prev.elements, element],
            version: operation.version,
          }));
        }
      },
      [sendOperation],
    ),

    updateElement: useCallback(
      (elementId: string, updates: Partial<AnyElement>) => {
        const operation = sendOperation({
          type: "update",
          elementId,
          data: updates,
        });

        if (operation) {
          setState((prev) => ({
            ...prev,
            elements: prev.elements.map((el) =>
              el.id === elementId
                ? { ...el, ...updates, updatedAt: Date.now() }
                : el,
            ),
            version: operation.version,
          }));
        }
      },
      [sendOperation],
    ),

    deleteElements: useCallback(
      (elementIds: string[]) => {
        elementIds.forEach((elementId) => {
          const operation = sendOperation({
            type: "delete",
            elementId,
          });

          if (operation) {
            setState((prev) => ({
              ...prev,
              elements: prev.elements.filter((el) => el.id !== elementId),
              selectedElements: prev.selectedElements.filter(
                (id) => id !== elementId,
              ),
              version: operation.version,
            }));
          }
        });
      },
      [sendOperation],
    ),

    selectElements: useCallback(
      (elementIds: string[]) => {
        setState((prev) => ({ ...prev, selectedElements: elementIds }));

        sendOperation({
          type: "select",
          data: elementIds,
        });
      },
      [sendOperation],
    ),

    updateCursor: useCallback(
      (position: { x: number; y: number; pageIndex: number }) => {
        sendOperation({
          type: "cursor",
          data: position,
        });
      },
      [sendOperation],
    ),

    setZoom: useCallback((zoom: number) => {
      setState((prev) => ({ ...prev, zoom }));
    }, []),

    setPageIndex: useCallback((pageIndex: number) => {
      setState((prev) => ({ ...prev, pageIndex }));
    }, []),

    undo: useCallback(() => {
      setState((prev) => {
        if (prev.history.past.length === 0) return prev;

        const previous = prev.history.past[prev.history.past.length - 1];
        const newPast = prev.history.past.slice(
          0,
          prev.history.past.length - 1,
        );

        return {
          ...prev,
          elements: previous,
          history: {
            past: newPast,
            present: previous,
            future: [prev.history.present, ...prev.history.future],
          },
        };
      });
    }, []),

    redo: useCallback(() => {
      setState((prev) => {
        if (prev.history.future.length === 0) return prev;

        const next = prev.history.future[0];
        const newFuture = prev.history.future.slice(1);

        return {
          ...prev,
          elements: next,
          history: {
            past: [...prev.history.past, prev.history.present],
            present: next,
            future: newFuture,
          },
        };
      });
    }, []),
  };

  // Selectors
  const selectors = {
    getElementById: useCallback(
      (id: string) => {
        const elementsById = selectElementsById(state);
        return elementsById[id];
      },
      [state],
    ),

    getElementsByPage: useCallback(
      (pageIndex?: number) => {
        return selectElementsByPage({
          ...state,
          pageIndex: pageIndex ?? state.pageIndex,
        });
      },
      [state],
    ),

    getSelectedElements: useCallback(() => {
      const elementsById = selectElementsById(state);
      return state.selectedElements
        .map((id) => elementsById[id])
        .filter(Boolean);
    }, [state]),

    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
  };

  // Computed properties with memoization
  const computed = {
    elementCount: state.elements.length,
    selectedCount: state.selectedElements.length,
    collaboratorCount: state.collaborators.length,
    currentPageElements: selectors.getElementsByPage(),
    isCollaborative: state.collaborators.length > 0,
  };

  return {
    state,
    actions,
    selectors,
    computed,
  };
}

export type RealtimePDFEditor = ReturnType<typeof useRealtimePDFEditor>;
