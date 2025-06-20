import ToolPlaceholder from "./ToolPlaceholder";
import { FileText } from "lucide-react";

const Convert = () => {
  return (
    <ToolPlaceholder
      toolName="Convert PDF"
      toolDescription="Convert PDF files to various formats like Word, Excel, PowerPoint and more."
      icon={<FileText className="w-12 h-12 text-orange-500" />}
      comingSoon={true}
    />
  );
};

export default Convert;
