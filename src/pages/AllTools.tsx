import ToolPlaceholder from "./ToolPlaceholder";
import { FileText } from "lucide-react";

// Working tools now redirect to real implementations
export const PdfToPowerPoint = () => (
  <ToolPlaceholder
    toolName="PDF to PowerPoint"
    toolDescription="Turn your PDF files into easy to edit PPT and PPTX slideshows."
    icon={<FileText className="w-12 h-12 text-red-500" />}
    workingTool={true}
    redirectTo="/pdf-to-powerpoint"
    isNew={true}
  />
);

export const PdfToExcel = () => (
  <ToolPlaceholder
    toolName="PDF to Excel"
    toolDescription="Pull data straight from PDFs into Excel spreadsheets in a few short seconds."
    icon={<FileText className="w-12 h-12 text-emerald-500" />}
    workingTool={true}
    redirectTo="/pdf-to-excel"
    isNew={true}
  />
);

export const WordToPdf = () => (
  <ToolPlaceholder
    toolName="Word to PDF"
    toolDescription="Make DOC and DOCX files easy to read by converting them to PDF."
    icon={<FileText className="w-12 h-12 text-blue-600" />}
    workingTool={true}
    redirectTo="/word-to-pdf"
  />
);

export const PowerPointToPdf = () => (
  <ToolPlaceholder
    toolName="PowerPoint to PDF"
    toolDescription="Make PPT and PPTX slideshows easy to view by converting them to PDF."
    icon={<FileText className="w-12 h-12 text-red-600" />}
  />
);

export const ExcelToPdf = () => (
  <ToolPlaceholder
    toolName="Excel to PDF"
    toolDescription="Make EXCEL spreadsheets easy to read by converting them to PDF."
    icon={<FileText className="w-12 h-12 text-emerald-600" />}
  />
);

export const EditPdf = () => (
  <ToolPlaceholder
    toolName="Edit PDF"
    toolDescription="Add text, images, shapes or freehand annotations to a PDF document. Edit the size, font, and color of the added content."
    icon={<FileText className="w-12 h-12 text-indigo-500" />}
  />
);

export const JpgToPdf = () => (
  <ToolPlaceholder
    toolName="JPG to PDF"
    toolDescription="Convert JPG images to PDF in seconds. Easily adjust orientation and margins."
    icon={<FileText className="w-12 h-12 text-pink-600" />}
    workingTool={true}
    redirectTo="/jpg-to-pdf"
    isNew={true}
  />
);

export const SignPdf = () => (
  <ToolPlaceholder
    toolName="Sign PDF"
    toolDescription="Sign yourself or request electronic signatures from others."
    icon={<FileText className="w-12 h-12 text-violet-500" />}
  />
);

export const Watermark = () => (
  <ToolPlaceholder
    toolName="Watermark"
    toolDescription="Stamp an image or text over your PDF in seconds. Choose the typography, transparency and position."
    icon={<FileText className="w-12 h-12 text-cyan-500" />}
  />
);

export const RotatePdf = () => (
  <ToolPlaceholder
    toolName="Rotate PDF"
    toolDescription="Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!"
    icon={<FileText className="w-12 h-12 text-teal-500" />}
  />
);

export const HtmlToPdf = () => (
  <ToolPlaceholder
    toolName="HTML to PDF"
    toolDescription="Convert webpages in HTML to PDF. Copy and paste the URL of the page you want and convert it to PDF with a click."
    icon={<FileText className="w-12 h-12 text-amber-500" />}
  />
);

export const UnlockPdf = () => (
  <ToolPlaceholder
    toolName="Unlock PDF"
    toolDescription="Remove PDF password security, giving you the freedom to use your PDFs as you want."
    icon={<FileText className="w-12 h-12 text-lime-500" />}
  />
);

export const ProtectPdf = () => (
  <ToolPlaceholder
    toolName="Protect PDF"
    toolDescription="Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access."
    icon={<FileText className="w-12 h-12 text-red-500" />}
  />
);

export const OrganizePdf = () => (
  <ToolPlaceholder
    toolName="Organize PDF"
    toolDescription="Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience."
    icon={<FileText className="w-12 h-12 text-slate-500" />}
  />
);

export const PdfToPdfA = () => (
  <ToolPlaceholder
    toolName="PDF to PDF/A"
    toolDescription="Transform your PDF to PDF/A, the ISO-standardized version of PDF for long-term archiving. Your PDF will preserve formatting when accessed in the future."
    icon={<FileText className="w-12 h-12 text-gray-500" />}
  />
);

export const RepairPdf = () => (
  <ToolPlaceholder
    toolName="Repair PDF"
    toolDescription="Repair a damaged PDF and recover data from corrupt PDF. Fix PDF files with our Repair tool."
    icon={<FileText className="w-12 h-12 text-orange-600" />}
  />
);

export const PageNumbers = () => (
  <ToolPlaceholder
    toolName="Page numbers"
    toolDescription="Add page numbers into PDFs with ease. Choose your positions, dimensions, typography."
    icon={<FileText className="w-12 h-12 text-purple-600" />}
  />
);

export const ScanToPdf = () => (
  <ToolPlaceholder
    toolName="Scan to PDF"
    toolDescription="Capture document scans from your mobile device and send them instantly to your browser."
    icon={<FileText className="w-12 h-12 text-green-600" />}
  />
);

export const OcrPdf = () => (
  <ToolPlaceholder
    toolName="OCR PDF"
    toolDescription="Easily convert scanned PDF into searchable and selectable documents."
    icon={<FileText className="w-12 h-12 text-blue-700" />}
  />
);

export const ComparePdf = () => (
  <ToolPlaceholder
    toolName="Compare PDF"
    toolDescription="Show a side-by-side document comparison and easily spot changes between different file versions."
    icon={<FileText className="w-12 h-12 text-indigo-600" />}
  />
);

export const RedactPdf = () => (
  <ToolPlaceholder
    toolName="Redact PDF"
    toolDescription="Redact text and graphics to permanently remove sensitive information from a PDF."
    icon={<FileText className="w-12 h-12 text-red-700" />}
  />
);

export const CropPdf = () => (
  <ToolPlaceholder
    toolName="Crop PDF"
    toolDescription="Crop margins of PDF documents or select specific areas, then apply the changes to one page or the whole document."
    icon={<FileText className="w-12 h-12 text-green-700" />}
  />
);
