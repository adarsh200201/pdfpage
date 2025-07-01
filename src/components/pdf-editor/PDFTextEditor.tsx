import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, PDFPageProxy, TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';
import 'pdfjs-dist/build/pdf.worker.entry';

// Set worker path
if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// Simple text layer implementation
class SimpleTextLayerBuilder {
  private textLayerDiv: HTMLDivElement;
  private pageNumber: number;
  private viewport: any;

  constructor({ textLayerDiv, pageNumber, viewport }: any) {
    this.textLayerDiv = textLayerDiv;
    this.pageNumber = pageNumber;
    this.viewport = viewport;
  }

  async setTextContent(textContent: any) {
    const textLayer = this.textLayerDiv;
    textLayer.innerHTML = '';

    if (!textContent || !textContent.items || textContent.items.length === 0) {
      return;
    }

    const textFrag = document.createDocumentFragment();

    for (const item of textContent.items) {
      const tx = pdfjsLib.Util.transform(
        this.viewport.transform,
        item.transform
      );

      const style = {
        left: `${tx[4]}px`,
        top: `${tx[5]}px`,
        fontSize: `${Math.sqrt((tx[0] * tx[0]) + (tx[1] * tx[1]))}px`,
        lineHeight: '1',
        position: 'absolute',
        cursor: 'text',
        whiteSpace: 'pre',
        transform: `matrix(${tx[0]},${tx[1]},${tx[2]},${tx[3]},0,0)`,
        transformOrigin: '0% 0%',
      };

      const span = document.createElement('span');
      span.textContent = item.str;
      Object.assign(span.style, style);
      textFrag.appendChild(span);
    }

    textLayer.appendChild(textFrag);
  }

  render() {
    // No-op for this simple implementation
  }
}

interface PDFTextEditorProps {
  file: File;
  onSave: (modifiedPdf: Blob) => void;
  onError: (error: Error) => void;
}

const PDFTextEditor: React.FC<PDFTextEditorProps> = ({ file, onSave, onError }) => {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [isEditing, setIsEditing] = useState(false);
  const [modifiedText, setModifiedText] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [textPosition, setTextPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 0 });

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
      } catch (error) {
        console.error('Error loading PDF:', error);
        onError(error as Error);
      }
    };

    loadPdf();
  }, [file, onError]);

  // Render PDF page
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage) as PDFPageProxy;
        const viewport = page.getViewport({ scale });
        
        // Set canvas dimensions
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page
        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        // Set up text layer
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = '';
          
          const textLayer = new SimpleTextLayerBuilder({
            textLayerDiv: textLayerRef.current,
            pageNumber: currentPage,
            viewport,
          });

          const textContent = await page.getTextContent();
          const textItems = textContent.items as TextItem[];
          textLayer.setTextContent(textContent);
          textLayer.render();
            
          // Make text selectable
          const textSpans = textLayerRef.current?.querySelectorAll('.textLayer > div');
          textSpans?.forEach((span) => {
            span.addEventListener('mouseup', handleTextSelection);
              span.addEventListener('mouseup', handleTextSelection);
            });
          });
        }
      } catch (error) {
        console.error('Error rendering PDF:', error);
        onError(error as Error);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale, onError]);

  const handleTextSelection = (e: MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') return;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setSelectedText(selection.toString());
    setSelectionPosition({
      left: rect.left + window.scrollX,
      top: rect.bottom + window.scrollY,
    });
    
    // Store the range for later use
    (window as any).lastSelection = range;
  };

  const handleEditText = () => {
    if (!textLayerRef.current) return;
    
    const range = (window as any).lastSelection as Range;
    if (!range) return;
    
    const rect = range.getBoundingClientRect();
    setTextPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    });
    
    setModifiedText(selectedText);
    setIsEditing(true);
    
    // Focus the textarea after a small delay to ensure it's rendered
    setTimeout(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.select();
    }, 0);
  };

  const saveTextEdit = () => {
    if (!isEditing) return;
    
    // In a real implementation, you would update the PDF with the modified text
    // This is a simplified version that just shows the concept
    console.log('Text modified:', modifiedText);
    
    // Here you would update the PDF with the modified text
    // For demonstration, we'll just update the selection
    if ((window as any).lastSelection) {
      const range = (window as any).lastSelection as Range;
      range.deleteContents();
      range.insertNode(document.createTextNode(modifiedText));
    }
    
    setIsEditing(false);
  };

  const handleSavePdf = async () => {
    if (!pdfDocument) return;
    
    try {
      // In a real implementation, you would use a PDF library that supports modification
      // like pdf-lib (https://pdf-lib.js.org/) to create a new PDF with the modified content
      // This is a simplified version that just returns the original file
      const arrayBuffer = await file.arrayBuffer();
      onSave(new Blob([arrayBuffer], { type: 'application/pdf' }));
    } catch (error) {
      console.error('Error saving PDF:', error);
      onError(error as Error);
    }
  };

  const handleNextPage = () => {
    if (pdfDocument && currentPage < pdfDocument.numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  if (!pdfDocument) {
    return <div>Loading PDF...</div>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Toolbar */}
      <div className="bg-gray-100 p-2 flex justify-between items-center">
        <div className="flex space-x-2">
          <button 
            onClick={handlePrevPage} 
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-white border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {pdfDocument.numPages}
          </span>
          <button 
            onClick={handleNextPage} 
            disabled={currentPage >= pdfDocument.numPages}
            className="px-3 py-1 bg-white border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={zoomOut}
            className="px-3 py-1 bg-white border rounded"
          >
            -
          </button>
          <span className="px-3 py-1">{Math.round(scale * 100)}%</span>
          <button 
            onClick={zoomIn}
            className="px-3 py-1 bg-white border rounded"
          >
            +
          </button>
        </div>
        <div>
          <button 
            onClick={handleSavePdf}
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save PDF
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="relative overflow-auto border border-gray-200" style={{ height: 'calc(100% - 50px)' }}>
        <div className="relative">
          <canvas ref={canvasRef} className="absolute top-0 left-0" />
          <div 
            ref={textLayerRef} 
            className="absolute top-0 left-0 textLayer"
            style={{ 
              transformOrigin: '0 0',
              transform: `scale(${scale})`,
              width: '100%',
              height: '100%',
              pointerEvents: 'auto',
            }}
          />
        </div>
      </div>

      {/* Text Edit Popup */}
      {isEditing && (
        <div 
          style={{
            position: 'absolute',
            top: `${textPosition.top}px`,
            left: `${textPosition.left}px`,
            zIndex: 1000,
          }}
          className="bg-white border border-gray-300 rounded shadow-lg p-2"
        >
          <textarea
            ref={textAreaRef}
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            style={{ minWidth: '200px', minHeight: '100px' }}
          />
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button 
              onClick={saveTextEdit}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Selection Toolbar */}
      {selectedText && !isEditing && (
        <div 
          style={{
            position: 'absolute',
            top: `${selectionPosition.top}px`,
            left: `${selectionPosition.left}px`,
            zIndex: 1000,
          }}
          className="bg-white border border-gray-300 rounded shadow-lg p-1 flex space-x-1"
        >
          <button 
            onClick={handleEditText}
            className="p-1 hover:bg-gray-100 rounded"
            title="Edit text"
          >
            ✏️
          </button>
          <button 
            onClick={() => navigator.clipboard.writeText(selectedText)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Copy text"
          >
            📋
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFTextEditor;
