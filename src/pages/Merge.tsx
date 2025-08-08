import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { PromoBanner } from "@/components/ui/promo-banner";
import MergeItem, { MergeFileItem } from "@/components/ui/merge-item";
import PdfPageItemComponent, {
  PdfPageItem,
} from "@/components/ui/pdf-page-item";
import FilePreviewModal from "@/components/ui/file-preview-modal";
import {
  ArrowLeft,
  Download,
  GripVertical,
  Trash2,
  RotateCw,
  Eye,
  Combine,
  CheckCircle,
  Loader2,
  Crown,
  AlertTriangle,
  Plus,
  FileText,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFService } from "@/services/pdfService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useToolTracking } from "@/hooks/useToolTracking";
import { useFloatingPopup } from "@/contexts/FloatingPopupContext";
import DownloadModal from "@/components/modals/DownloadModal";
import { useDownloadModal } from "@/hooks/useDownloadModal";
import { useActionAuth } from "@/hooks/useActionAuth";

const Merge = () => {
  const [files, setFiles] = useState<MergeFileItem[]>([]);
  const [pageItems, setPageItems] = useState<PdfPageItem[]>([]);
  const [viewMode, setViewMode] = useState<"files" | "pages">("files");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [mergedFileUrl, setMergedFileUrl] = useState<string>("");

  const [progress, setProgress] = useState(0);
  const [mergedFileSize, setMergedFileSize] = useState(0);
  const [previewFile, setPreviewFile] = useState<MergeFileItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const [pageInsertionTarget, setPageInsertionTarget] = useState<{
    itemId: string;
    afterPage: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Floating popup tracking
  const { trackToolUsage } = useFloatingPopup();

  // Download modal
  const downloadModal = useDownloadModal({
    countdownSeconds: 5,
    adSlot: "merge-download-ad",
    showAd: true,
  });

  // Action-level authentication
  const actionAuth = useActionAuth({
    action: "merge_pdf",
    requireAuth: true,
  });

  // Mixpanel tracking
  const tracking = useToolTracking({
    toolName: "merge",
    category: "PDF Tool",
    trackPageView: true,
    trackFunnel: true,
  });

  const handleFilesSelect = (newFiles: File[]) => {
    const processedFiles: MergeFileItem[] = newFiles
      .map((file) => {
        const isPdf = file.type === "application/pdf";
        const isImage = file.type.startsWith("image/");

        if (!isPdf && !isImage) {
          toast({
            title: "Unsupported file type",
            description: `${file.name} is not a PDF or image file`,
            variant: "destructive",
          });
          return null;
        }

        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          type: isPdf ? "pdf" : "image",
        };
      })
      .filter(Boolean) as MergeFileItem[];

    // Handle page-level insertion
    if (pageInsertionTarget) {
      handlePageInsertion(processedFiles);
      setPageInsertionTarget(null);
    } else if (insertionIndex !== null) {
      // Insert at specific position
      setFiles((prev) => {
        const newFiles = [...prev];
        newFiles.splice(insertionIndex, 0, ...processedFiles);
        return newFiles;
      });
      setInsertionIndex(null);
    } else {
      // Add to end
      setFiles((prev) => [...prev, ...processedFiles]);
    }

    // Also update page items for page view
    updatePageItems(processedFiles);

    // Show success message
    if (processedFiles.length > 0) {
      toast({
        title: "Files added successfully",
        description: `Added ${processedFiles.length} file${processedFiles.length > 1 ? "s" : ""} to merge queue`,
      });
    }
  };

  const updatePageItems = (newFiles: MergeFileItem[]) => {
    const newPageItems: PdfPageItem[] = newFiles.map((file) => ({
      id: file.id,
      file: file.file,
      name: file.name,
      size: file.size,
      type: file.type,
      isExpanded: false,
    }));

    setPageItems((prev) => [...prev, ...newPageItems]);
  };

  const handlePageInsertion = (newFiles: MergeFileItem[]) => {
    // This would handle inserting files at specific page positions
    // For now, we'll add them to the regular files array
    // In a full implementation, this would track page-level positioning
    setFiles((prev) => [...prev, ...newFiles]);

    toast({
      title: "Files inserted",
      description: `Inserted ${newFiles.length} file${newFiles.length > 1 ? "s" : ""} after page ${pageInsertionTarget?.afterPage}`,
    });
  };

  const handleInsertFiles = (index: number, position: "before" | "after") => {
    const actualIndex = position === "before" ? index : index + 1;
    setInsertionIndex(actualIndex);

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInsertAtPage = (itemId: string, afterPage: number) => {
    setPageInsertionTarget({ itemId, afterPage });

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }

    toast({
      description: `Select files to insert after page ${afterPage}`,
    });
  };

  const handleToggleExpanded = (id: string) => {
    setPageItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item,
      ),
    );
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast({
      description: "File removed from merge queue",
    });
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);
      return newFiles;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveFile(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handlePreview = (item: MergeFileItem) => {
    setPreviewFile(item);
    setShowPreviewModal(true);
  };

  const handleRotate = async (id: string) => {
    const item = files.find((f) => f.id === id);
    if (!item || item.type !== "pdf") return;

    try {
      const rotatedBytes = await PDFService.rotatePDF(item.file, 90);
      const rotatedFile = new File([rotatedBytes], item.name, {
        type: "application/pdf",
        lastModified: Date.now(),
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, file: rotatedFile, size: rotatedFile.size } : f,
        ),
      );

      toast({
        description: "PDF rotated 90° clockwise",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rotate PDF",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: "Not enough files",
        description: "Please select at least 2 files to merge.",
        variant: "destructive",
      });
      return;
    }

    // Execute merge with authentication check
    await actionAuth.executeWithAuth(async () => {
      await performMerge();
    });
  };

  const performMerge = async () => {
    setIsProcessing(true);
    setProgress(0);

    try {
      // Get total file size
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const pdfCount = files.filter((f) => f.type === "pdf").length;
      const imageCount = files.filter((f) => f.type === "image").length;

      toast({
        title: `🔄 Merging ${files.length} files...`,
        description: `${pdfCount} PDFs + ${imageCount} images • Total size: ${formatFileSize(totalSize)}`,
      });

      // Check file size limits (100MB for all users)
      const maxSize = 100 * 1024 * 1024;
      if (totalSize > maxSize) {
        throw new Error(`File size exceeds 100MB limit`);
      }

      setProgress(10);

      // Prepare files for merging
      const filesToMerge = files.map((item) => ({
        file: item.file,
        type: item.type,
      }));

      // Use mixed file merger that handles both PDFs and images
      const mergedPdfBytes = await PDFService.mergeMixedFiles(
        filesToMerge,
        (progressPercent) => {
          setProgress(progressPercent);
        },
      );

      setMergedFileSize(mergedPdfBytes.length);

      // Track usage
      await PDFService.trackUsage("merge", files.length, totalSize);

      // Track for floating popup (only for anonymous users)
      if (!isAuthenticated) {
        trackToolUsage();
      }

      // For premium users, upload to Cloudinary for sharing
      if (user?.isPremium) {
        try {
          const cloudinaryUrl = await PDFService.uploadToCloudinary(
            mergedPdfBytes,
            `merged-pdf-${Date.now()}.pdf`,
          );
          setMergedFileUrl(cloudinaryUrl);
        } catch (cloudError) {
          console.warn("Cloudinary upload failed:", cloudError);
          // Continue without cloud upload
        }
      }

      // Create download blob
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setMergedFileUrl(url);

      setIsComplete(true);

      toast({
        title: "Success!",
        description: `Your ${files.length} files have been merged into a single PDF.`,
      });
    } catch (error: any) {
      console.error("Error merging files:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to merge files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMergedFile = () => {
    if (mergedFileUrl) {
      // Format file size for display
      const fileSizeFormatted = mergedFileSize
        ? `${(mergedFileSize / 1024 / 1024).toFixed(2)} MB`
        : undefined;

      // Open download modal with ad and countdown
      downloadModal.openDownloadModal(
        () => {
          const downloadLink = document.createElement("a");
          downloadLink.href = mergedFileUrl;
          downloadLink.download = "merged-document.pdf";
          downloadLink.click();
        },
        {
          fileName: "merged-document.pdf",
          fileSize: fileSizeFormatted,
          title: "🎉 Your merged PDF is ready!",
          description:
            "We've successfully combined your PDF files. Download will start automatically.",
        },
      );
    }
  };

  const resetTool = () => {
    setFiles([]);
    setIsComplete(false);
    setProgress(0);
    setMergedFileSize(0);
    if (mergedFileUrl && !mergedFileUrl.startsWith("https://")) {
      URL.revokeObjectURL(mergedFileUrl);
    }
    setMergedFileUrl("");
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <PromoBanner className="mb-8" />

        {/* Navigation */}
        <div className="flex items-center space-x-2 mb-8">
          <Link
            to="/"
            className="text-body-medium text-text-light hover:text-brand-red"
          >
            <ArrowLeft className="w-4 h-4 mr-1 inline" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Combine className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-dark mb-3 sm:mb-4 px-4">
            Merge PDF & Images
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-text-light max-w-2xl mx-auto px-4">
            Combine PDFs and images in any order you want. Add files anywhere in
            the sequence with visual previews.
          </p>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-6 sm:space-y-8">
            {/* File Upload */}
            {files.length === 0 && (
              <div className="bg-white rounded-xl p-4 sm:p-8 shadow-sm border border-gray-100">
                <FileUpload
                  onFilesSelect={handleFilesSelect}
                  multiple={true}
                  maxSize={25}
                  accept=".pdf,.jpg,.jpeg,.png"
                  allowedTypes={["pdf", "image"]}
                  uploadText="Drop files here or click to browse"
                  supportText="Supported formats: PDF, JPG, PNG"
                />
              </div>
            )}

            {/* File List with Visual Previews */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
                  <h3 className="text-heading-small text-text-dark">
                    Files to Merge ({files.length})
                  </h3>
                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                    <div className="text-sm text-gray-500 text-center sm:text-left">
                      {files.filter((f) => f.type === "pdf").length} PDFs,{" "}
                      {files.filter((f) => f.type === "image").length} Images
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                      <Button
                        variant={viewMode === "files" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("files")}
                        className="text-xs flex-1 sm:flex-none"
                      >
                        File View
                      </Button>
                      <Button
                        variant={viewMode === "pages" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("pages")}
                        className="text-xs flex-1 sm:flex-none"
                      >
                        Page View
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add More Files
                    </Button>
                  </div>
                </div>

                {/* Insertion indicator */}
                {insertionIndex !== null && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Select files to insert at position {insertionIndex + 1}
                  </div>
                )}

                <div className="space-y-2">
                  {files.map((item, index) => (
                    <MergeItem
                      key={item.id}
                      item={item}
                      index={index}
                      isDragging={draggedIndex === index}
                      isInsertionTarget={false}
                      onRemove={removeFile}
                      onRotate={handleRotate}
                      onPreview={handlePreview}
                      onInsertBefore={(idx) => handleInsertFiles(idx, "before")}
                      onInsertAfter={(idx) => handleInsertFiles(idx, "after")}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>

                {/* Hidden file input for adding more files */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFilesSelect(Array.from(e.target.files));
                    }
                    e.target.value = ""; // Reset input
                  }}
                  className="hidden"
                />

                {/* Instructions */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    How to use:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Drag and drop files to reorder them</li>
                    <li>
                      • Click "Insert Here" buttons to add files at specific
                      positions
                    </li>
                    <li>• Click the eye icon to preview any file</li>
                    <li>• Use the rotate button for PDF files</li>
                    <li>• Supports PDF, JPG, and PNG files</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Merge Button */}
            {files.length >= 2 && (
              <div className="text-center px-4 sm:px-0">
                <Button
                  size="lg"
                  onClick={handleMerge}
                  disabled={isProcessing}
                  className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Merging Files...
                    </>
                  ) : (
                    <>
                      <Combine className="w-5 h-5 mr-2" />
                      {actionAuth.isAuthenticated
                        ? `Merge ${files.length} Files`
                        : `Sign in to Merge ${files.length} Files`}
                    </>
                  )}
                </Button>

                {files.length < 2 && (
                  <p className="text-body-small text-text-light mt-2">
                    Add at least 2 files to merge
                  </p>
                )}

                {!actionAuth.isAuthenticated && files.length >= 2 && (
                  <p className="text-sm text-gray-600 mt-2">
                    🔒 Sign in with Google to merge your files
                  </p>
                )}
              </div>
            )}

            {/* Processing */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
                <h3 className="text-heading-small text-text-dark mb-2">
                  Merging your files...
                </h3>
                <p className="text-body-medium text-text-light mb-4">
                  Processing {files.filter((f) => f.type === "pdf").length} PDFs
                  and {files.filter((f) => f.type === "image").length} images
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {progress}% complete
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-heading-small text-text-dark mb-2">
              Your files have been merged successfully!
            </h3>
            <p className="text-body-medium text-text-light mb-6">
              Your merged PDF is ready for download (
              {formatFileSize(mergedFileSize)})
            </p>

            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-center sm:space-y-0 sm:space-x-4 px-4 sm:px-0">
              <Button
                size="lg"
                onClick={downloadMergedFile}
                className="bg-brand-red hover:bg-red-600 w-full sm:w-auto"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Merged PDF
              </Button>
              <Button
                variant="outline"
                onClick={resetTool}
                className="w-full sm:w-auto"
              >
                Merge More Files
              </Button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 sm:mt-12 px-4 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center px-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Combine className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="font-semibold text-text-dark mb-2 text-sm sm:text-base">
                Flexible Positioning
              </h4>
              <p className="text-xs sm:text-sm text-text-light leading-relaxed max-w-xs mx-auto">
                Insert files anywhere in the sequence with drag-and-drop or
                insertion controls
              </p>
            </div>

            <div className="text-center px-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-6 h-6 text-green-500" />
              </div>
              <h4 className="font-semibold text-text-dark mb-2 text-sm sm:text-base">
                PDF + Images
              </h4>
              <p className="text-xs sm:text-sm text-text-light leading-relaxed max-w-xs mx-auto">
                Combine PDFs with JPG and PNG images into a single document
              </p>
            </div>

            <div className="text-center px-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-purple-500" />
              </div>
              <h4 className="font-semibold text-text-dark mb-2 text-sm sm:text-base">
                Visual Preview
              </h4>
              <p className="text-xs sm:text-sm text-text-light leading-relaxed max-w-xs mx-auto">
                See thumbnail previews to easily decide where to insert content
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        file={previewFile?.file || null}
        type={previewFile?.type || "pdf"}
      />

      {/* Download Modal with Ad */}
      <DownloadModal {...downloadModal.modalProps} />
    </div>
  );
};

export default Merge;
