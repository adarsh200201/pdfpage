import { useState, useCallback } from "react";

interface UseDownloadModalOptions {
  countdownSeconds?: number;
  adSlot?: string;
  showAd?: boolean;
  autoClose?: boolean;
}

interface DownloadModalState {
  isOpen: boolean;
  fileName?: string;
  fileSize?: string;
  title?: string;
  description?: string;
}

export const useDownloadModal = (options: UseDownloadModalOptions = {}) => {
  const {
    countdownSeconds = 5,
    adSlot = "1234567890",
    showAd = true,
    autoClose = true,
  } = options;

  const [modalState, setModalState] = useState<DownloadModalState>({
    isOpen: false,
  });

  const [downloadCallback, setDownloadCallback] = useState<(() => void) | null>(
    null,
  );

  const openDownloadModal = useCallback(
    (
      downloadFn: () => void | Promise<void>,
      modalOptions: {
        fileName?: string;
        fileSize?: string;
        title?: string;
        description?: string;
      } = {},
    ) => {
      setDownloadCallback(() => downloadFn);
      setModalState({
        isOpen: true,
        fileName: modalOptions.fileName || "processed-file.pdf",
        fileSize: modalOptions.fileSize,
        title: modalOptions.title || "🎉 Your file is ready for download!",
        description:
          modalOptions.description ||
          "We're preparing your file for download. This will only take a moment.",
      });
    },
    [],
  );

  const closeDownloadModal = useCallback(() => {
    setModalState({ isOpen: false });
    setDownloadCallback(null);
  }, []);

  const handleDownload = useCallback(async () => {
    if (downloadCallback) {
      try {
        await downloadCallback();
      } catch (error) {
        console.error("Download failed:", error);
        throw error;
      }
    }
  }, [downloadCallback]);

  return {
    // Modal state
    isModalOpen: modalState.isOpen,
    modalProps: {
      isOpen: modalState.isOpen,
      onClose: closeDownloadModal,
      onDownload: handleDownload,
      fileName: modalState.fileName,
      fileSize: modalState.fileSize,
      title: modalState.title,
      description: modalState.description,
      countdownSeconds,
      adSlot,
      showAd,
    },

    // Actions
    openDownloadModal,
    closeDownloadModal,

    // Helper function to integrate with existing download buttons
    wrapDownloadAction: (
      originalDownloadFn: () => void | Promise<void>,
      modalOptions?: {
        fileName?: string;
        fileSize?: string;
        title?: string;
        description?: string;
      },
    ) => {
      return () => {
        openDownloadModal(originalDownloadFn, modalOptions);
      };
    },
  };
};

export default useDownloadModal;
