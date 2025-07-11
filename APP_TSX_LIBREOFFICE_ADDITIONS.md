# App.tsx LibreOffice Tool Additions

## Import Statements to Add

Add these imports after the existing imports (around line 110):

```typescript
// Import LibreOffice conversion tools
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
```

## Routes to Add

Add these routes after the LibreOffice section (around line 306):

```typescript
                      {/* LibreOffice Conversion Tools - ALL WORKING */}
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
```

## Manual Addition Required

Since I cannot automatically edit App.tsx, please manually add these:

1. The import statements around line 110
2. The route definitions around line 306 (after the existing LibreOffice section)

This will make all 12 LibreOffice conversion tools accessible via their direct URLs.
