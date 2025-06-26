import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NetworkStatus } from "@/components/ui/network-status";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { configurePDFjs, getPDFConfigStatus } from "@/lib/pdf-config";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import ImgPage from "./pages/ImgPage";
import ImgCompress from "./pages/ImgCompress";
import ImgResize from "./pages/ImgResize";
import ImgJpgToPng from "./pages/ImgJpgToPng";
import ImgPngToJpg from "./pages/ImgPngToJpg";
import ImgWatermark from "./pages/ImgWatermark";
import ImgRotate from "./pages/ImgRotate";
import ImgCrop from "./pages/ImgCrop";
import ImgRemoveBg from "./pages/ImgRemoveBg";
import ImgUpscale from "./pages/ImgUpscale";
import ImgToPdf from "./pages/ImgToPdf";
import ImgMeme from "./pages/ImgMeme";
import ImgConvert from "./pages/ImgConvert";
import FaviconConverter from "./pages/FaviconConverter";
import FaviconPage from "./pages/FaviconPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Merge from "./pages/Merge";
import Split from "./pages/Split";
import Compress from "./pages/Compress";
import Convert from "./pages/Convert";
import PdfToJpg from "./pages/PdfToJpg";
import PdfToWord from "./pages/PdfToWord";
import WordToPdf from "./pages/WordToPdf";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Rotate from "./pages/Rotate";
import CropPdf from "./pages/CropPdf";
import TestAllTools from "./pages/TestAllTools";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Press from "./pages/Press";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Affiliate from "./pages/Affiliate";
import FeatureRequests from "./pages/FeatureRequests";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Gdpr from "./pages/Gdpr";
import Security from "./pages/Security";
import ApiDocs from "./pages/ApiDocs";
import Status from "./pages/Status";

// Import all the real tool implementations from AllTools
import {
  PdfToPowerPoint,
  PdfToExcel,
  JpgToPdf,
  Watermark,
  UnlockPdf,
  ProtectPdf,
  OrganizePdf,
  EditPdf,
  RotatePdf,
  HtmlToPdf,
  PdfToPdfA,
  RepairPdf,
  PageNumbers,
  ScanToPdf,
  OcrPdf,
  ComparePdf,
  RedactPdf,
  PowerPointToPdf,
  ExcelToPdf,
} from "./pages/AllTools";

// Import the comprehensive PDF editor
import SignPdf from "./pages/SignPdf";

import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import ToolRedirect from "./pages/ToolRedirect";
import ToolAvailable from "./pages/ToolAvailable";
import AvailableTools from "./pages/AvailableTools";

const queryClient = new QueryClient();

const App = () => {
  // Initialize PDF.js configuration on app start
  useEffect(() => {
    const initializePDFjs = async () => {
      try {
        console.log("🚀 Initializing PDF.js configuration...");
        await configurePDFjs();
        const status = getPDFConfigStatus();
        console.log("✅ PDF.js configuration status:", status);

        if (!status.isConfigured) {
          console.warn("⚠️ PDF.js may not be properly configured");
        } else {
          console.log(
            "🎉 All PDF tools are now ready for real-time processing!",
          );
        }
      } catch (error) {
        console.error("❌ Failed to initialize PDF.js:", error);
      }
    };

    initializePDFjs();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />

                {/* Image Tools */}
                <Route path="/img" element={<ImgPage />} />
                <Route path="/img/compress" element={<ImgCompress />} />
                <Route path="/img/resize" element={<ImgResize />} />
                <Route path="/img/jpg-to-png" element={<ImgJpgToPng />} />
                <Route path="/img/png-to-jpg" element={<ImgPngToJpg />} />
                <Route path="/img/watermark" element={<ImgWatermark />} />
                <Route path="/img/rotate" element={<ImgRotate />} />
                <Route path="/img/crop" element={<ImgCrop />} />
                <Route path="/img/remove-bg" element={<ImgRemoveBg />} />
                <Route path="/img/upscale" element={<ImgUpscale />} />
                <Route path="/img/to-pdf" element={<ImgToPdf />} />
                <Route path="/img/meme" element={<ImgMeme />} />
                <Route path="/img/convert" element={<ImgConvert />} />
                <Route path="/img/favicon" element={<FaviconConverter />} />
                <Route path="/favicon" element={<FaviconPage />} />

                {/* Authentication */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Core PDF Tools - REAL-TIME IMPLEMENTATIONS */}
                <Route path="/merge" element={<Merge />} />
                <Route path="/split" element={<Split />} />
                <Route path="/compress" element={<Compress />} />
                <Route path="/convert" element={<Convert />} />
                <Route path="/rotate" element={<Rotate />} />

                {/* PDF Conversion Tools - ALL WORKING */}
                <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
                <Route path="/pdf-to-word" element={<PdfToWord />} />
                <Route path="/word-to-pdf" element={<WordToPdf />} />
                <Route
                  path="/pdf-to-powerpoint"
                  element={<PdfToPowerPoint />}
                />
                <Route path="/pdf-to-excel" element={<PdfToExcel />} />
                <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
                <Route
                  path="/powerpoint-to-pdf"
                  element={<PowerPointToPdf />}
                />
                <Route path="/excel-to-pdf" element={<ExcelToPdf />} />
                <Route path="/html-to-pdf" element={<HtmlToPdf />} />

                {/* PDF Enhancement Tools - ALL WORKING */}
                <Route path="/edit-pdf" element={<EditPdf />} />
                <Route path="/sign-pdf" element={<SignPdf />} />
                <Route path="/watermark" element={<Watermark />} />
                <Route path="/protect-pdf" element={<ProtectPdf />} />
                <Route path="/unlock-pdf" element={<UnlockPdf />} />
                <Route path="/organize-pdf" element={<OrganizePdf />} />
                <Route path="/page-numbers" element={<PageNumbers />} />
                <Route path="/crop-pdf" element={<CropPdf />} />

                {/* Advanced PDF Tools - ALL WORKING */}
                <Route path="/pdf-to-pdfa" element={<PdfToPdfA />} />
                <Route path="/repair-pdf" element={<RepairPdf />} />
                <Route path="/scan-to-pdf" element={<ScanToPdf />} />
                <Route path="/ocr-pdf" element={<OcrPdf />} />
                <Route path="/compare-pdf" element={<ComparePdf />} />
                <Route path="/redact-pdf" element={<RedactPdf />} />
                <Route path="/rotate-pdf" element={<RotatePdf />} />

                {/* Legacy routes for backwards compatibility */}
                <Route path="/tools" element={<Index />} />

                {/* Dashboard and Settings */}
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />

                {/* Company Pages */}
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/press" element={<Press />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/affiliate" element={<Affiliate />} />
                <Route path="/feature-requests" element={<FeatureRequests />} />
                <Route path="/help" element={<Help />} />

                {/* Legal Pages */}
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/gdpr" element={<Gdpr />} />
                <Route path="/security" element={<Security />} />

                {/* API and Status */}
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route path="/status" element={<Status />} />

                {/* Development and Testing */}
                <Route path="/test-all-tools" element={<TestAllTools />} />
                <Route path="/available-tools" element={<AvailableTools />} />

                {/* Tool Redirect Pages (legacy compatibility - these show working tools now) */}
                <Route
                  path="/tool-redirect/:toolSlug"
                  element={<ToolRedirect />}
                />
                <Route
                  path="/tool-available/:toolSlug"
                  element={<ToolAvailable />}
                />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <NetworkStatus />
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
