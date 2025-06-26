export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds extends Point, Size {}

export type ToolType =
  | "select"
  | "text"
  | "signature"
  | "draw"
  | "highlight"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "image"
  | "stamp"
  | "form-field"
  | "sticky-note";

export interface EditorElement {
  id: string;
  type: ToolType;
  pageIndex: number;
  bounds: Bounds;
  properties: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface TextElement extends EditorElement {
  type: "text";
  properties: {
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    alignment: "left" | "center" | "right";
    rotation: number;
  };
}

export interface SignatureElement extends EditorElement {
  type: "signature";
  properties: {
    signatureType: "draw" | "type" | "upload";
    signatureData: string;
    signatureText?: string;
    strokeWidth: number;
    color: string;
  };
}

export interface DrawElement extends EditorElement {
  type: "draw";
  properties: {
    paths: Point[][];
    strokeWidth: number;
    color: string;
    opacity: number;
  };
}

export interface HighlightElement extends EditorElement {
  type: "highlight";
  properties: {
    color: string;
    opacity: number;
  };
}

export interface ShapeElement extends EditorElement {
  type: "rectangle" | "circle" | "line" | "arrow";
  properties: {
    strokeWidth: number;
    strokeColor: string;
    fillColor: string;
    opacity: number;
    strokeDashArray?: number[];
  };
}

export interface ImageElement extends EditorElement {
  type: "image";
  properties: {
    src: string;
    alt: string;
    opacity: number;
    rotation: number;
  };
}

export interface FormFieldElement extends EditorElement {
  type: "form-field";
  properties: {
    fieldType: "text" | "checkbox" | "radio" | "dropdown" | "signature";
    name: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
  };
}

export interface StickyNoteElement extends EditorElement {
  type: "sticky-note";
  properties: {
    text: string;
    color: string;
    fontSize: number;
  };
}

export type AnyElement =
  | TextElement
  | SignatureElement
  | DrawElement
  | HighlightElement
  | ShapeElement
  | ImageElement
  | FormFieldElement
  | StickyNoteElement;

export interface EditorState {
  currentTool: ToolType;
  selectedElements: string[];
  elements: AnyElement[];
  clipboard: AnyElement[];
  history: {
    past: AnyElement[][];
    present: AnyElement[];
    future: AnyElement[][];
  };
  zoom: number;
  pageIndex: number;
  canvasSize: Size;
  isDrawing: boolean;
  currentDrawPath: Point[];
}

export interface EditorAction {
  type: string;
  payload?: any;
}

export interface PDFPageInfo {
  pageIndex: number;
  viewport: any;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}

export interface EditorToolbarItem {
  id: ToolType;
  label: string;
  icon: React.ComponentType<any>;
  category: "select" | "text" | "draw" | "shape" | "annotate" | "form";
  shortcut?: string;
  submenu?: EditorToolbarItem[];
}

export interface ColorPalette {
  name: string;
  value: string;
}

export interface FontOption {
  name: string;
  value: string;
}

export interface EditorConfig {
  colors: ColorPalette[];
  fonts: FontOption[];
  defaultFontSize: number;
  defaultStrokeWidth: number;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
}
