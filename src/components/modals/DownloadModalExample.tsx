/**
 * DownloadModal Integration Example
 *
 * This component demonstrates how to integrate the DownloadModal
 * into any existing tool component for monetized downloads.
 *
 * Copy this pattern to any component that has download functionality.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import DownloadModal from "./DownloadModal";
import { useDownloadModal } from "@/hooks/useDownloadModal";

const DownloadModalExample: React.FC = () => {
  const [mockFileUrl, setMockFileUrl] = useState<string>("");

  // Initialize download modal hook
  const downloadModal = useDownloadModal({
    countdownSeconds: 5, // 5 second countdown
    adSlot: "your-adsense-slot-id", // Replace with your AdSense slot ID
    showAd: true, // Set to false to disable ads
  });

  // Simulate file processing completion
  const handleProcessFile = () => {
    // Simulate file processing
    setTimeout(() => {
      // Create a mock download URL (in real app, this comes from your processing result)
      const mockUrl = "blob:http://example.com/processed-file.pdf";
      setMockFileUrl(mockUrl);

      // Trigger download modal instead of direct download
      triggerDownloadWithModal(mockUrl, "processed-file.pdf", "2.5 MB");
    }, 1000);
  };

  // Method 1: Using the hook directly
  const triggerDownloadWithModal = (
    fileUrl: string,
    fileName: string,
    fileSize: string,
  ) => {
    downloadModal.openDownloadModal(
      // Download function - this will be called after countdown/ad
      () => {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      // Modal options
      {
        fileName,
        fileSize,
        title: "🎉 Your file is ready for download!",
        description:
          "We've successfully processed your file. Download will start automatically.",
      },
    );
  };

  // Method 2: Using the wrapper helper (even easier)
  const handleEasyDownload = downloadModal.wrapDownloadAction(
    () => {
      // Your original download logic here
      const link = document.createElement("a");
      link.href = mockFileUrl;
      link.download = "easy-download.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    {
      fileName: "easy-download.pdf",
      fileSize: "1.8 MB",
      title: "✨ Ready to download!",
      description: "Your file has been processed successfully.",
    },
  );

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        DownloadModal Integration Example
      </h2>

      <div className="space-y-4 mb-8">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Step 1: Process File</h3>
          <Button onClick={handleProcessFile} className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            Process File (Simulate)
          </Button>
        </div>

        {mockFileUrl && (
          <div className="p-4 border rounded-lg bg-green-50">
            <h3 className="font-semibold mb-2">Step 2: Download with Modal</h3>
            <div className="space-y-2">
              <Button
                onClick={() =>
                  triggerDownloadWithModal(
                    mockFileUrl,
                    "manual-example.pdf",
                    "2.5 MB",
                  )
                }
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download (Method 1: Manual)
              </Button>

              <Button
                onClick={handleEasyDownload}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download (Method 2: Wrapper)
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Integration Code Example */}
      <div className="p-4 bg-gray-100 rounded-lg text-sm">
        <h3 className="font-semibold mb-2">Quick Integration Code:</h3>
        <pre className="whitespace-pre-wrap text-xs">{`
// 1. Import the hook and modal
import DownloadModal from "@/components/modals/DownloadModal";
import { useDownloadModal } from "@/hooks/useDownloadModal";

// 2. Initialize in your component
const downloadModal = useDownloadModal({
  countdownSeconds: 5,
  adSlot: "your-adsense-slot-id",
  showAd: true,
});

// 3. Replace your download button onClick
const handleDownload = () => {
  downloadModal.openDownloadModal(
    () => {
      // Your original download code here
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      link.click();
    },
    {
      fileName: "my-file.pdf",
      fileSize: "2.5 MB",
      title: "Ready to download!",
      description: "Your file is ready.",
    }
  );
};

// 4. Add modal to JSX (before closing div)
<DownloadModal {...downloadModal.modalProps} />
        `}</pre>
      </div>

      {/* The actual modal component */}
      <DownloadModal {...downloadModal.modalProps} />
    </div>
  );
};

export default DownloadModalExample;
