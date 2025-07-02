let XLSX, ExcelJS, jsPDF;

try {
  XLSX = require("xlsx");
  ExcelJS = require("exceljs");
  jsPDF = require("jspdf");
  require("jspdf-autotable");
} catch (error) {
  console.error(
    "❌ Failed to load required dependencies for Excel to PDF conversion:",
    error.message,
  );
  throw new Error("Excel to PDF conversion dependencies not available");
}

/**
 * Convert Excel file to PDF
 * @param {string} filePath - Path to the Excel file
 * @param {Object} options - Conversion options
 * @returns {Buffer} PDF buffer
 */
async function convertExcelToPdf(filePath, options = {}) {
  try {
    console.log("📊 Starting Excel to PDF conversion...");

    // Default options
    const settings = {
      pageSize: options.pageSize || "A4",
      orientation: options.orientation || "landscape",
      fitToPage: options.fitToPage !== false,
      includeGridlines: options.includeGridlines !== false,
      includeHeaders: options.includeHeaders !== false,
      scaleToFit: options.scaleToFit || 100,
      worksheetSelection: options.worksheetSelection || "all",
      selectedSheets: options.selectedSheets || [],
      includeFormulas: options.includeFormulas || false,
      preserveFormatting: options.preserveFormatting !== false,
      includeCharts: options.includeCharts !== false,
      compression: options.compression || "medium",
      watermark: options.watermark || "",
      headerFooter: options.headerFooter || false,
      margin: options.margin || 20,
      ...options,
    };

    // Read Excel file using ExcelJS for better formatting support
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // Create PDF document
    const pdf = new jsPDF({
      orientation: settings.orientation,
      unit: "pt",
      format: settings.pageSize.toLowerCase(),
    });

    // Get page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let isFirstWorksheet = true;

    // Process worksheets
    workbook.eachSheet((worksheet, sheetId) => {
      // Skip hidden worksheets
      if (worksheet.state === "hidden") return;

      // Check worksheet selection
      if (
        settings.worksheetSelection === "specific" &&
        !settings.selectedSheets.includes(worksheet.name)
      ) {
        return;
      }

      console.log(`📋 Processing worksheet: ${worksheet.name}`);

      // Add new page for additional worksheets
      if (!isFirstWorksheet) {
        pdf.addPage();
      }
      isFirstWorksheet = false;

      // Add worksheet title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(worksheet.name, settings.margin, settings.margin + 20);

      // Convert worksheet to table data
      const tableData = convertWorksheetToTableData(worksheet, settings);

      if (tableData.length === 0) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text("No data to display", settings.margin, settings.margin + 50);
        return;
      }

      // Calculate table options
      const tableOptions = {
        startY: settings.margin + 40,
        margin: { left: settings.margin, right: settings.margin },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          lineColor: settings.includeGridlines
            ? [200, 200, 200]
            : [255, 255, 255],
          lineWidth: settings.includeGridlines ? 0.1 : 0,
        },
        headStyles: {
          fillColor: settings.includeHeaders
            ? [240, 240, 240]
            : [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: settings.includeHeaders ? "bold" : "normal",
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248],
        },
        tableWidth: "auto",
        columnStyles: {},
      };

      // Apply scaling
      if (settings.scaleToFit !== 100) {
        const scale = settings.scaleToFit / 100;
        tableOptions.styles.fontSize *= scale;
        tableOptions.styles.cellPadding *= scale;
      }

      // Auto-fit to page width if enabled
      if (settings.fitToPage && tableData[0]) {
        const availableWidth = pageWidth - settings.margin * 2;
        const columnCount = tableData[0].length;
        const columnWidth = availableWidth / columnCount;

        // Set uniform column widths
        for (let i = 0; i < columnCount; i++) {
          tableOptions.columnStyles[i] = { cellWidth: columnWidth };
        }
      }

      // Create the table
      try {
        // Separate headers and body
        const headers =
          settings.includeHeaders && tableData.length > 0 ? [tableData[0]] : [];
        const body =
          settings.includeHeaders && tableData.length > 1
            ? tableData.slice(1)
            : tableData;

        pdf.autoTable({
          head: headers,
          body: body,
          ...tableOptions,
        });
      } catch (tableError) {
        console.warn(
          `Warning: Could not create table for ${worksheet.name}:`,
          tableError.message,
        );
        // Fallback to simple text
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        let yPos = settings.margin + 50;

        tableData.slice(0, 50).forEach((row, index) => {
          if (yPos > pageHeight - settings.margin) {
            pdf.addPage();
            yPos = settings.margin;
          }
          const rowText = row.join(" | ");
          pdf.text(rowText.substring(0, 100), settings.margin, yPos);
          yPos += 15;
        });
      }

      // Add watermark if specified
      if (settings.watermark) {
        addWatermark(pdf, settings.watermark, pageWidth, pageHeight);
      }
    });

    // Add header/footer if enabled
    if (settings.headerFooter) {
      addHeaderFooter(pdf, pageWidth, pageHeight, settings.margin);
    }

    // Return PDF buffer
    console.log("✅ Excel to PDF conversion completed");
    return Buffer.from(pdf.output("arraybuffer"));
  } catch (error) {
    console.error("❌ Excel to PDF conversion failed:", error);

    // Provide more specific error messages
    let errorMessage = "Excel to PDF conversion failed";

    if (error.message.includes("ENOENT")) {
      errorMessage =
        "File not found or corrupted. Please upload a valid Excel file.";
    } else if (error.message.includes("not supported")) {
      errorMessage =
        "This Excel file format is not supported. Please try a different file.";
    } else if (error.message.includes("too large")) {
      errorMessage = "The Excel file is too large. Please try a smaller file.";
    } else if (error.message.includes("memory")) {
      errorMessage =
        "The Excel file is too complex to process. Please try a simpler file.";
    } else if (error.message) {
      errorMessage = `Conversion failed: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Convert worksheet to table data array
 * @param {Object} worksheet - ExcelJS worksheet
 * @param {Object} settings - Conversion settings
 * @returns {Array} Table data
 */
function convertWorksheetToTableData(worksheet, settings) {
  const tableData = [];
  const maxRows = 1000; // Limit for performance
  const maxCols = 50; // Limit for performance

  try {
    let rowCount = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowCount >= maxRows) return;

      const rowData = [];
      let hasData = false;

      // Process cells in the row
      for (
        let colNumber = 1;
        colNumber <= Math.min(row.cellCount, maxCols);
        colNumber++
      ) {
        const cell = row.getCell(colNumber);
        let cellValue = "";

        if (cell && cell.value !== null && cell.value !== undefined) {
          // Handle different cell types
          if (
            typeof cell.value === "object" &&
            cell.value.formula &&
            settings.includeFormulas
          ) {
            cellValue = cell.value.formula;
          } else if (
            typeof cell.value === "object" &&
            cell.value.result !== undefined
          ) {
            cellValue = cell.value.result;
          } else if (cell.value instanceof Date) {
            cellValue = cell.value.toLocaleDateString();
          } else if (typeof cell.value === "number") {
            // Format numbers properly
            if (cell.numFmt && cell.numFmt.includes("%")) {
              cellValue = (cell.value * 100).toFixed(2) + "%";
            } else if (cell.numFmt && cell.numFmt.includes("$")) {
              cellValue = "$" + cell.value.toFixed(2);
            } else {
              cellValue = cell.value.toString();
            }
          } else {
            cellValue = cell.value.toString();
          }

          hasData = true;
        }

        rowData.push(cellValue);
      }

      // Only add rows that have data
      if (hasData) {
        tableData.push(rowData);
        rowCount++;
      }
    });

    return tableData;
  } catch (error) {
    console.warn("Warning: Error processing worksheet data:", error.message);
    return [];
  }
}

/**
 * Add watermark to PDF
 * @param {Object} pdf - jsPDF instance
 * @param {string} watermarkText - Watermark text
 * @param {number} pageWidth - Page width
 * @param {number} pageHeight - Page height
 */
function addWatermark(pdf, watermarkText, pageWidth, pageHeight) {
  try {
    // Save current state
    pdf.saveGraphicsState();

    // Set watermark properties
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(48);
    pdf.setFont("helvetica", "bold");

    // Calculate center position
    const textWidth =
      (pdf.getStringUnitWidth(watermarkText) * 48) / pdf.internal.scaleFactor;
    const x = (pageWidth - textWidth) / 2;
    const y = pageHeight / 2;

    // Rotate and add watermark
    pdf.text(watermarkText, x, y, {
      angle: 45,
      align: "center",
    });

    // Restore state
    pdf.restoreGraphicsState();
  } catch (error) {
    console.warn("Warning: Could not add watermark:", error.message);
  }
}

/**
 * Add header and footer to PDF
 * @param {Object} pdf - jsPDF instance
 * @param {number} pageWidth - Page width
 * @param {number} pageHeight - Page height
 * @param {number} margin - Page margin
 */
function addHeaderFooter(pdf, pageWidth, pageHeight, margin) {
  try {
    const totalPages = pdf.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      // Header
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Excel to PDF Conversion - ${new Date().toLocaleDateString()}`,
        margin,
        margin / 2,
      );

      // Footer
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin - 50,
        pageHeight - margin / 2,
      );
    }
  } catch (error) {
    console.warn("Warning: Could not add header/footer:", error.message);
  }
}

module.exports = {
  convertExcelToPdf,
};
