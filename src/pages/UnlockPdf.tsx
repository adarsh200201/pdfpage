import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoBanner } from "@/components/ui/promo-banner";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { PDFService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Download,
  FileText,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Crown,
  Star,
  Lock,
  RefreshCw,
  Shield,
  AlertTriangle,
} from "lucide-react";

const UnlockPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [passwords, setPasswords] = useState<{ [key: string]: string }>({});
  const [newPasswords, setNewPasswords] = useState<{ [key: string]: string }>(
    {},
  );
  const [showPasswords, setShowPasswords] = useState<{
    [key: string]: boolean;
  }>({});
  const [showNewPasswords, setShowNewPasswords] = useState<{
    [key: string]: boolean;
  }>({});
  const [unlockedFiles, setUnlockedFiles] = useState<
    { name: string; url: string; size: number }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"unlock" | "change">("unlock");

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
    setIsComplete(false);
    setUnlockedFiles([]);

    // Initialize password fields for each file
    const newPasswords: { [key: string]: string } = {};
    const newNewPasswords: { [key: string]: string } = {};
    const newShowPasswords: { [key: string]: boolean } = {};
    const newShowNewPasswords: { [key: string]: boolean } = {};
    uploadedFiles.forEach((file, index) => {
      newPasswords[index] = "";
      newNewPasswords[index] = "";
      newShowPasswords[index] = false;
      newShowNewPasswords[index] = false;
    });
    setPasswords(newPasswords);
    setNewPasswords(newNewPasswords);
    setShowPasswords(newShowPasswords);
    setShowNewPasswords(newShowNewPasswords);
  };

  const updatePassword = (index: number, password: string) => {
    setPasswords((prev) => ({ ...prev, [index]: password }));
  };

  const updateNewPassword = (index: number, password: string) => {
    setNewPasswords((prev) => ({ ...prev, [index]: password }));
  };

  const toggleShowPassword = (index: number) => {
    setShowPasswords((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleShowNewPassword = (index: number) => {
    setShowNewPasswords((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleUnlock = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PDF files to unlock.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
    try {
      const usageCheck = await PDFService.checkUsageLimit();
      if (!usageCheck.canUse) {
        setShowAuthModal(true);
        return;
      }
    } catch (error) {
      console.error("Error checking usage limit:", error);
    }

    setIsProcessing(true);

    try {
      const unlockedResults: { name: string; url: string; size: number }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const password = passwords[i] || "";

        if (!password.trim()) {
          toast({
            title: `❌ Missing password for ${file.name}`,
            description: "Please enter the password to unlock this PDF.",
            variant: "destructive",
          });
          continue;
        }

        try {
          toast({
            title: `🔄 Unlocking ${file.name}...`,
            description: "Removing password protection from PDF",
          });

          // Use real backend service
          const result = await PDFService.unlockPDF(file, password, {
            onProgress: (progress) => {
              console.log(`Unlock progress for ${file.name}: ${progress}%`);
            },
          });

          const blob = new Blob([result.data], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);

          unlockedResults.push({
            name:
              result.headers?.["x-original-filename"] ||
              file.name.replace(/\.pdf$/i, "_unlocked.pdf"),
            url,
            size: blob.size,
          });

          toast({
            title: `✅ ${file.name} unlocked successfully`,
            description: "Password protection removed from PDF",
          });
        } catch (error: any) {
          console.error(`Error unlocking ${file.name}:`, error);

          // Enhanced error handling for better user experience
          let errorTitle = `❌ Error unlocking ${file.name}`;
          let errorDescription = error.message || "Unable to unlock this PDF.";

          if (
            error.message?.includes("advanced encryption") ||
            error.message?.includes("specialized tools")
          ) {
            errorTitle = `🔐 Advanced Encryption Detected`;
            errorDescription =
              "This PDF uses advanced encryption that requires desktop software. Try Adobe Acrobat or similar tools for best results.";
          } else if (error.message?.includes("password")) {
            errorDescription = "Please check your password and try again.";
          }

          toast({
            title: errorTitle,
            description: errorDescription,
            variant: "destructive",
            duration: 6000, // Longer duration for mobile users
          });
        }
      }

      if (unlockedResults.length > 0) {
        setUnlockedFiles(unlockedResults);
        setIsComplete(true);

        // Track usage for revenue analytics
        await PDFService.trackUsage(
          "unlock-pdf",
          files.length,
          files.reduce((sum, file) => sum + file.size, 0),
        );

        toast({
          title: "🎉 Unlocking completed!",
          description: `Successfully unlocked ${unlockedResults.length} PDF(s).`,
        });
      }
    } catch (error) {
      console.error("Error unlocking PDFs:", error);
      toast({
        title: "Unlocking failed",
        description:
          "There was an error unlocking your PDFs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordChange = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PDF files to change password.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
    try {
      const usageCheck = await PDFService.checkUsageLimit();
      if (!usageCheck.canUse) {
        setShowAuthModal(true);
        return;
      }
    } catch (error) {
      console.error("Error checking usage limit:", error);
    }

    setIsProcessing(true);

    try {
      const changedResults: { name: string; url: string; size: number }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const currentPassword = passwords[i] || "";
        const newPassword = newPasswords[i] || "";

        if (!currentPassword.trim()) {
          toast({
            title: `❌ Missing current password for ${file.name}`,
            description: "Please enter the current password.",
            variant: "destructive",
          });
          continue;
        }

        if (!newPassword.trim()) {
          toast({
            title: `❌ Missing new password for ${file.name}`,
            description: "Please enter a new password.",
            variant: "destructive",
          });
          continue;
        }

        if (newPassword.length < 4) {
          toast({
            title: `❌ Weak password for ${file.name}`,
            description: "New password should be at least 4 characters long.",
            variant: "destructive",
          });
          continue;
        }

        try {
          toast({
            title: `🔄 Changing password for ${file.name}...`,
            description: "Updating PDF password protection",
          });

          // Use real backend service
          const result = await PDFService.changePDFPassword(
            file,
            currentPassword,
            newPassword,
            {
              onProgress: (progress) => {
                console.log(
                  `Password change progress for ${file.name}: ${progress}%`,
                );
              },
            },
          );

          const blob = new Blob([result.data], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);

          changedResults.push({
            name:
              result.headers?.["x-original-filename"] ||
              file.name.replace(/\.pdf$/i, "_new_password.pdf"),
            url,
            size: blob.size,
          });

          toast({
            title: `✅ Password changed for ${file.name}`,
            description: "PDF password updated successfully",
          });
        } catch (error: any) {
          console.error(`Error changing password for ${file.name}:`, error);
          toast({
            title: `❌ Error changing password for ${file.name}`,
            description:
              error.message ||
              "Incorrect current password or processing failed.",
            variant: "destructive",
          });
        }
      }

      if (changedResults.length > 0) {
        setUnlockedFiles(changedResults);
        setIsComplete(true);

        // Track usage for revenue analytics
        await PDFService.trackUsage(
          "unlock-pdf",
          files.length,
          files.reduce((sum, file) => sum + file.size, 0),
        );

        toast({
          title: "🎉 Password change completed!",
          description: `Successfully changed password for ${changedResults.length} PDF(s).`,
        });
      }
    } catch (error) {
      console.error("Error changing PDF passwords:", error);
      toast({
        title: "Password change failed",
        description:
          "There was an error changing PDF passwords. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  const downloadAll = () => {
    unlockedFiles.forEach((file, index) => {
      setTimeout(() => downloadFile(file.url, file.name), index * 100);
    });
  };

  const reset = () => {
    setFiles([]);
    setUnlockedFiles([]);
    setIsComplete(false);
    setPasswords({});
    setNewPasswords({});
    setShowPasswords({});
    setShowNewPasswords({});
  };

  const renderPasswordInputs = (isChangeMode: boolean = false) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-text-dark mb-4">
        PDF Files ({files.length})
      </h3>

      <div className="space-y-4 mb-6">
        {files.map((file, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <FileText className="w-5 h-5 text-lime-500" />
              <div className="flex-1">
                <p className="font-medium text-text-dark">{file.name}</p>
                <p className="text-sm text-text-light">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  {isChangeMode ? "Current Password" : "Password for this PDF"}
                </label>
                <div className="relative">
                  <input
                    type={showPasswords[index] ? "text" : "password"}
                    value={passwords[index] || ""}
                    onChange={(e) => updatePassword(index, e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                    placeholder={
                      isChangeMode
                        ? "Enter current PDF password"
                        : "Enter PDF password"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword(index)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords[index] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password (only for change mode) */}
              {isChangeMode && (
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPasswords[index] ? "text" : "password"}
                      value={newPasswords[index] || ""}
                      onChange={(e) => updateNewPassword(index, e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                      placeholder="Enter new password (min 4 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowNewPassword(index)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPasswords[index] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">
              Security Notice
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              Your passwords are processed securely using pdf-lib and not
              stored. Files are deleted after processing. Only you have access
              to the processed PDFs.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={isChangeMode ? handlePasswordChange : handleUnlock}
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isChangeMode ? "Changing..." : "Unlocking..."}
            </>
          ) : (
            <>
              {isChangeMode ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Change Passwords
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock PDF Files
                </>
              )}
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => setFiles([])}>
          Clear Files
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-lime-500 to-lime-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Unlock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-medium text-text-dark mb-4">
            PDF Security Tools
          </h1>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Professional PDF password management tools. Remove password
            protection or change passwords on your protected PDF files securely.
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <Shield className="w-4 h-4 mr-2" />
            PDF processing powered by pdf-lib with real password verification!
          </div>
        </div>

        {/* Main Content */}
        {!isComplete ? (
          <div className="space-y-8">
            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "unlock" | "change")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unlock" className="flex items-center gap-2">
                  <Unlock className="w-4 h-4" />
                  Remove Password
                </TabsTrigger>
                <TabsTrigger value="change" className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Change Password
                </TabsTrigger>
              </TabsList>

              <TabsContent value="unlock" className="space-y-6">
                {/* Legal Disclaimer */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">
                        Legal Disclaimer
                      </h4>
                      <p className="text-sm text-yellow-700">
                        This tool only works if you know the current password.
                        Unauthorized access to protected documents is not
                        supported. By using this service, you confirm you have
                        the legal right to access and modify these PDF files.
                      </p>
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                {files.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-text-dark mb-2">
                        Remove PDF Password
                      </h3>
                      <p className="text-text-light">
                        Upload password-protected PDF files to remove their
                        password protection
                      </p>
                    </div>
                    <FileUpload
                      onFilesSelect={handleFileUpload}
                      accept=".pdf"
                      multiple={true}
                      maxSize={50}
                      allowedTypes={["pdf"]}
                      uploadText="Select PDF files or drop PDF files here"
                      supportText="Supports password-protected PDF files"
                    />
                  </div>
                ) : (
                  renderPasswordInputs(false)
                )}
              </TabsContent>

              <TabsContent value="change" className="space-y-6">
                {/* Legal Disclaimer */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">
                        Legal Disclaimer
                      </h4>
                      <p className="text-sm text-yellow-700">
                        This tool only works if you know the current password.
                        Unauthorized access to protected documents is not
                        supported. By using this service, you confirm you have
                        the legal right to access and modify these PDF files.
                      </p>
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                {files.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-text-dark mb-2">
                        Change PDF Password
                      </h3>
                      <p className="text-text-light">
                        Upload password-protected PDF files to change their
                        password
                      </p>
                    </div>
                    <FileUpload
                      onFilesSelect={handleFileUpload}
                      accept=".pdf"
                      multiple={true}
                      maxSize={50}
                      allowedTypes={["pdf"]}
                      uploadText="Select PDF files or drop PDF files here"
                      supportText="Supports password-protected PDF files"
                    />
                  </div>
                ) : (
                  renderPasswordInputs(true)
                )}
              </TabsContent>
            </Tabs>

            {/* Premium Features */}
            {!user?.isPremium && (
              <Card className="border-brand-yellow bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-800">
                    <Crown className="w-5 h-5 mr-2 text-brand-yellow" />
                    Unlock Premium Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-orange-700 mb-4">
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Batch process multiple PDFs
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Advanced 256-bit AES encryption
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Custom permission controls
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-brand-yellow" />
                      Priority processing with qpdf
                    </li>
                  </ul>
                  <Button className="bg-brand-yellow text-black hover:bg-yellow-400">
                    <Crown className="w-4 h-4 mr-2" />
                    Get Premium
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Results */
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === "unlock" ? (
                  <Unlock className="w-8 h-8 text-green-600" />
                ) : (
                  <RefreshCw className="w-8 h-8 text-green-600" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                {activeTab === "unlock"
                  ? "Unlocking Complete!"
                  : "Password Change Complete!"}
              </h3>
              <p className="text-text-light">
                Successfully processed {unlockedFiles.length} PDF(s)
              </p>
            </div>

            {/* File List */}
            <div className="space-y-3 mb-6">
              {unlockedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {activeTab === "unlock" ? (
                      <Unlock className="w-5 h-5 text-lime-500" />
                    ) : (
                      <RefreshCw className="w-5 h-5 text-lime-500" />
                    )}
                    <div>
                      <p className="font-medium text-text-dark">{file.name}</p>
                      <p className="text-sm text-text-light">
                        {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                        {activeTab === "unlock"
                          ? "Unlocked"
                          : "Password Changed"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(file.url, file.name)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={downloadAll} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download All Files
              </Button>
              <Button variant="outline" onClick={reset}>
                Process More Files
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="register"
      />
    </div>
  );
};

export default UnlockPdf;
