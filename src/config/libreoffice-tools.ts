// LibreOffice tools have been removed from this application
// This file is kept for backwards compatibility but is now empty

export interface LibreOfficeToolConfig {
  id: string;
  name: string;
  description: string;
  acceptedTypes: string[];
  outputType: string;
  rejectedTypes: string[];
  icon: string;
  category: "document" | "spreadsheet" | "presentation";
}

export const LIBREOFFICE_TOOLS: LibreOfficeToolConfig[] = [];

export const validateFileType = (
  fileName: string,
  toolId: string,
): { isValid: boolean; error?: string } => {
  return { isValid: false, error: "LibreOffice tools are no longer available" };
};

export const getToolByAcceptedType = (
  fileExtension: string,
): LibreOfficeToolConfig[] => {
  return [];
};

export const getToolsByCategory = (
  category: LibreOfficeToolConfig["category"],
): LibreOfficeToolConfig[] => {
  return [];
};
