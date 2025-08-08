import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NetworkStatus } from "@/components/ui/network-status";
import PWAStatusBar from "@/components/layout/PWAStatusBar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configurePDFjs, getPDFConfigStatus } from "@/lib/pdf-config";
import { HelmetProvider } from "react-helmet-async";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";
import CoreWebVitals from "@/components/CoreWebVitals";
import SecurityHeaders from "@/components/SecurityHeaders";
import CriticalRenderingOptimizer from "@/components/CriticalRenderingOptimizer";
import SearchConsoleVerification from "@/components/SearchConsoleVerification";
import "./styles/mobile-responsive.css";

import AccessibilityEnhancer from "@/components/AccessibilityEnhancer";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import GoogleSearchOptimizer from "@/components/GoogleSearchOptimizer";
import GoogleKnowledgePanelOptimizer from "@/components/GoogleKnowledgePanelOptimizer";
import EnhancedBreadcrumbSchema from "@/components/EnhancedBreadcrumbSchema";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import EnhancedEditPdf from "./pages/EnhancedEditPdf";
import RealtimeEditor from "./pages/RealtimeEditor";

import EnhancedPdfToPpt from "./pages/EnhancedPdfToPpt";
import EnhancedPdfEditor from "./pages/EnhancedPdfEditor";
import EnhancedWatermark from "./pages/EnhancedWatermark";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FloatingPopupProvider } from "@/contexts/FloatingPopupContext";
import { MixpanelProvider } from "@/contexts/MixpanelContext";
import { GlobalToolTrackingProvider } from "@/contexts/GlobalToolTrackingContext";
import Index from "./pages/Index";
import IndexTest from "./pages/IndexTest";
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
import ImageTools from "./pages/ImageTools";
// FaviconConverter removed - replaced with separate tools
import FaviconPage from "./pages/FaviconPage";
import ImageToFavicon from "./pages/ImageToFavicon";
import TextToFavicon from "./pages/TextToFavicon";
import EmojiToFavicon from "./pages/EmojiToFavicon";
import LogoToFavicon from "./pages/LogoToFavicon";
import Login from "./pages/Login";
import ModernLogin from "./pages/ModernLogin";
import Blog from "./pages/Blog";

import SEOAudit from "./pages/SEOAudit";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Merge from "./pages/Merge";
import Split from "./pages/Split";
import Compress from "./pages/Compress";
import CompressProcessing from "./pages/CompressProcessing";
import Convert from "./pages/Convert";
import PdfToJpg from "./pages/PdfToJpg";
import PdfToWord from "./pages/PdfToWord";
import WordToPdf from "./pages/WordToPdf";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Rotate from "./pages/Rotate";
import RotatePdfAdvanced from "./pages/RotatePdfAdvanced";
import CropPdf from "./pages/CropPdf";

import About from "./pages/About";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Affiliate from "./pages/Affiliate";
import FeatureRequests from "./pages/FeatureRequests";
import ReportBug from "./pages/ReportBug";
import FeatureRequest from "./pages/FeatureRequest";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Gdpr from "./pages/Gdpr";
import Security from "./pages/Security";
import ApiDocs from "./pages/ApiDocs";
import Status from "./pages/Status";
import UnlockPdf from "./pages/UnlockPdf";

// Import all the real tool implementations from AllTools
import {
  PdfToPowerPoint,
  Watermark,
  ProtectPdf,
  OrganizePdf,
  RotatePdf,
  PdfToPdfA,
  RepairPdf,
  PageNumbers,
  ScanToPdf,
  OcrPdf,
  ComparePdf,
  RedactPdf,
  PowerPointToPdf,
} from "./pages/AllTools";

// Import dedicated ExcelToPdf page
import ExcelToPdf from "./pages/ExcelToPdf";

// Import dedicated HTML to PDF component
import HtmlToPdf from "./pages/HtmlToPdf";

// Import PDF converter landing page
import PdfConverter from "./pages/PdfConverter";

// Import all PDF tools page
import AllPdfTools from "./pages/AllPdfTools";

// Import professional OCR PDF component
import OcrPdfProfessional from "./pages/OcrPdfProfessional";

// Import production-grade compression component
import CompressPro from "./pages/Compress";

// Import dedicated PDF to Excel component
import PdfToExcel from "./pages/PdfToExcel";

// Import the enhanced EditPdf component
import EditPdf from "./pages/EditPdf";

// Import enhanced JPG to PDF component
import JpgToPdf from "./pages/JpgToPdf";
import TextToPdf from "./pages/TextToPdf";
import OdtToPdf from "./pages/OdtToPdf";
import RtfToPdf from "./pages/RtfToPdf";
import CsvToXlsx from "./pages/CsvToXlsx";
import OdtToDocx from "./pages/OdtToDocx";
import RtfToDocx from "./pages/RtfToDocx";
import DocxToOdt from "./pages/DocxToOdt";
import XlsToCsv from "./pages/XlsToCsv";
import XlsxToOds from "./pages/XlsxToOds";
import PptxToOdp from "./pages/PptxToOdp";
import PptxToPng from "./pages/PptxToPng";
import DocToOdt from "./pages/DocToOdt";

// Import the comprehensive PDF editor
import SignPdf from "./pages/SignPdf";
import DocumentSigning from "./pages/DocumentSigning";
import ToastDemo from "./pages/ToastDemo";
import AdvancedPDFEditor from "./pages/AdvancedPDFEditor";

import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import ComingSoon from "./pages/ComingSoon";
import ToolRedirect from "./pages/ToolRedirect";
import ToolAvailable from "./pages/ToolAvailable";
import AvailableTools from "./pages/AvailableTools";
import AuthCallback from "./pages/AuthCallback";
import OAuthTest from "./pages/OAuthTest";
import OAuthDebugTest from "./pages/OAuthDebugTest";
import OAuth403Fix from "./pages/OAuth403Fix";
import WorkingOAuthTest from "./pages/WorkingOAuthTest";

import AdminRoute from "./components/admin/AdminRoute";
import LibreOfficeTools from "./pages/LibreOfficeTools";

// Import new enterprise and support pages
import Press from "./pages/Press";
import Help from "./pages/Help";
import Enterprise from "./pages/Enterprise";
import Download from "./pages/Download";
import BlogPostPage from "./pages/BlogPost";

const queryClient = new QueryClient();

// Component to control scroll behavior for tools
const ScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    // Don't automatically scroll to top when navigating to tool pages
    // Let users stay where they are or let individual tools control their own scrolling
    const isToolPage =
      location.pathname.startsWith("/merge") ||
      location.pathname.startsWith("/split") ||
      location.pathname.startsWith("/compress") ||
      location.pathname.startsWith("/convert") ||
      location.pathname.startsWith("/rotate") ||
      location.pathname.startsWith("/img/") ||
      location.pathname.startsWith("/pdf-to-") ||
      location.pathname.startsWith("/word-to-") ||
      location.pathname.startsWith("/jpg-to-") ||
      location.pathname.startsWith("/watermark") ||
      location.pathname.startsWith("/protect") ||
      location.pathname.startsWith("/unlock") ||
      location.pathname.startsWith("/organize") ||
      location.pathname.startsWith("/edit-pdf") ||
      location.pathname.startsWith("/sign-pdf") ||
      location.pathname.startsWith("/crop-pdf") ||
      location.pathname.includes("pdf");

    // Only scroll to top for main pages like home, about, pricing etc.
    if (!isToolPage) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return null;
};

const App = () => {
  // Initialize PDF.js configuration on app start
  useEffect(() => {
    const initializePDFjs = async () => {
      try {
        // Configure PDF.js with proper worker setup
        await configurePDFjs();

        // PDF configuration completed silently
      } catch (error) {
        console.error("❌ Failed to initialize PDF.js:", error);
      }
    };

    initializePDFjs();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FloatingPopupProvider>
          <LanguageProvider>
            <TooltipProvider>
              <ErrorBoundary fallback={<div />}>
                <Toaster />
              </ErrorBoundary>
              <ErrorBoundary fallback={<div />}>
                <Sonner />
              </ErrorBoundary>
              <BrowserRouter>
                <MixpanelProvider>
                  <GlobalToolTrackingProvider>
                    <PerformanceOptimizer />
                    <CriticalRenderingOptimizer />
                    <CoreWebVitals />
                    <SecurityHeaders />
                    <SearchConsoleVerification />
                    <AccessibilityEnhancer />
                    <LocalBusinessSchema />
                    <GoogleSearchOptimizer />
                    <GoogleKnowledgePanelOptimizer />
                    <EnhancedBreadcrumbSchema />
                    <PWAStatusBar />
                    <ScrollRestoration />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/test" element={<IndexTest />} />

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
                      {/* Redirect old favicon URL to new tools page */}
                      <Route
                        path="/img/favicon"
                        element={<Navigate to="/favicon" replace />}
                      />
                      <Route path="/favicon" element={<FaviconPage />} />
                      <Route
                        path="/favicon/image-to-favicon"
                        element={<ImageToFavicon />}
                      />
                      <Route
                        path="/favicon/text-to-favicon"
                        element={<TextToFavicon />}
                      />
                      <Route
                        path="/favicon/emoji-to-favicon"
                        element={<EmojiToFavicon />}
                      />
                      <Route
                        path="/favicon/logo-to-favicon"
                        element={<LogoToFavicon />}
                      />

                      {/* Authentication */}
                      <Route path="/login" element={<ModernLogin />} />
                      <Route path="/login/old" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                      />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/oauth-test" element={<OAuthTest />} />
                      <Route path="/oauth-debug" element={<OAuthDebugTest />} />
                      <Route path="/oauth-403-fix" element={<OAuth403Fix />} />
                      <Route path="/working-oauth-test" element={<WorkingOAuthTest />} />

                      {/* Core PDF Tools - REAL-TIME IMPLEMENTATIONS */}
                      <Route path="/merge" element={<Merge />} />
                      <Route path="/split" element={<Split />} />
                      <Route path="/compress" element={<CompressPro />} />
                      <Route
                        path="/compress-processing"
                        element={<CompressProcessing />}
                      />
                      <Route path="/convert" element={<Convert />} />
                      <Route path="/pdf-converter" element={<PdfConverter />} />
                      <Route path="/all-tools" element={<AllPdfTools />} />
                      <Route path="/pdf-tools" element={<AllPdfTools />} />
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
                      <Route path="/text-to-pdf" element={<TextToPdf />} />
                      <Route path="/odt-to-pdf" element={<OdtToPdf />} />
                      <Route path="/rtf-to-pdf" element={<RtfToPdf />} />
                      <Route path="/csv-to-xlsx" element={<CsvToXlsx />} />
                      <Route path="/odt-to-docx" element={<OdtToDocx />} />
                      <Route path="/rtf-to-docx" element={<RtfToDocx />} />
                      <Route path="/docx-to-odt" element={<DocxToOdt />} />
                      <Route path="/xls-to-csv" element={<XlsToCsv />} />
                      <Route path="/xlsx-to-ods" element={<XlsxToOds />} />
                      <Route path="/pptx-to-odp" element={<PptxToOdp />} />
                      <Route path="/pptx-to-png" element={<PptxToPng />} />
                      <Route path="/doc-to-odt" element={<DocToOdt />} />

                      {/* AI-Powered Tools - ENHANCED FEATURES */}
                      <Route
                        path="/ai-pdf-to-ppt"
                        element={<EnhancedPdfToPpt />}
                      />
                      <Route
                        path="/ai-pdf-editor"
                        element={<EnhancedPdfEditor />}
                      />
                      <Route
                        path="/ai-watermark"
                        element={<EnhancedWatermark />}
                      />

                      {/* LibreOffice Tools */}
                      <Route
                        path="/libreoffice"
                        element={<LibreOfficeTools />}
                      />

                      {/* PDF Enhancement Tools - ALL WORKING */}
                      <Route path="/edit-pdf" element={<EditPdf />} />
                      <Route
                        path="/enhanced-edit-pdf"
                        element={<EnhancedEditPdf />}
                      />
                      <Route path="/sign-pdf" element={<SignPdf />} />
          <Route path="/document-signing" element={<DocumentSigning />} />
          <Route path="/toast-demo" element={<ToastDemo />} />
                      <Route
                        path="/advanced-pdf-editor"
                        element={<AdvancedPDFEditor />}
                      />
                      <Route
                        path="/realtime-editor"
                        element={<RealtimeEditor />}
                      />

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
                      <Route path="/ocr-pdf" element={<OcrPdfProfessional />} />
                      <Route path="/compare-pdf" element={<ComparePdf />} />
                      <Route path="/redact-pdf" element={<RedactPdf />} />
                      <Route
                        path="/rotate-pdf"
                        element={<RotatePdfAdvanced />}
                      />

                      {/* Legacy routes for backwards compatibility */}
                      <Route path="/tools" element={<Index />} />

                      {/* Dashboard and Settings */}
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route
                        path="/jEG7MtWenZDOfC3-iFMYJC_1aaA"
                        element={<AdminRoute />}
                      />
                      <Route path="/settings" element={<Settings />} />

                      {/* Company Pages */}
                      <Route path="/about" element={<About />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogPostPage />} />

                      <Route path="/seo-audit" element={<SEOAudit />} />
                      <Route path="/careers" element={<Careers />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/affiliate" element={<Affiliate />} />
                      <Route path="/press" element={<Press />} />
                      <Route path="/help" element={<Help />} />
                      <Route path="/enterprise" element={<Enterprise />} />
                      <Route path="/download" element={<Download />} />
                      <Route
                        path="/feature-requests"
                        element={<FeatureRequests />}
                      />
                      <Route path="/report-bug" element={<ReportBug />} />
                      <Route
                        path="/feature-request"
                        element={<FeatureRequest />}
                      />

                      {/* Legal Pages */}
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/cookies" element={<Cookies />} />
                      <Route path="/gdpr" element={<Gdpr />} />
                      <Route path="/security" element={<Security />} />

                      {/* API and Status */}
                      <Route path="/api-docs" element={<ApiDocs />} />
                      <Route path="/status" element={<Status />} />
                      <Route path="/coming-soon" element={<ComingSoon />} />

                      <Route
                        path="/available-tools"
                        element={<AvailableTools />}
                      />


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
                  </GlobalToolTrackingProvider>
                </MixpanelProvider>
              </BrowserRouter>
            </TooltipProvider>
          </LanguageProvider>
        </FloatingPopupProvider>
      </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
